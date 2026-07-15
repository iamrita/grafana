package sync

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/oauth2"
	"golang.org/x/sync/singleflight"

	claims "github.com/grafana/authlib/types"

	"github.com/grafana/grafana/pkg/apimachinery/identity"
	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/login/social"
	"github.com/grafana/grafana/pkg/login/social/socialtest"
	"github.com/grafana/grafana/pkg/services/auth"
	"github.com/grafana/grafana/pkg/services/auth/authtest"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/contexthandler/ctxkey"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/oauthtoken"
	"github.com/grafana/grafana/pkg/services/oauthtoken/oauthtokentest"
)

func TestOAuthTokenSync_SyncOAuthTokenHook(t *testing.T) {
	type testCase struct {
		desc      string
		identity  *authn.Identity
		oauthInfo *social.OAuthInfo

		expectToken *login.UserAuth

		expectedTryRefreshErr       error
		expectTryRefreshTokenCalled bool

		expectRevokeTokenCalled bool

		expectedErr error
	}

	tests := []testCase{
		{
			desc:                        "should skip sync when identity is not a user",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeServiceAccount},
			expectTryRefreshTokenCalled: false,
		},
		{
			desc:                        "should skip sync when identity is a user but is not authenticated with session token",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser},
			expectTryRefreshTokenCalled: false,
		},
		{
			desc:                        "should invalidate access token and session token if token refresh fails",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser, SessionToken: &auth.UserToken{}, AuthenticatedBy: login.AzureADAuthModule},
			expectedTryRefreshErr:       errors.New("some err"),
			expectTryRefreshTokenCalled: true,
			expectRevokeTokenCalled:     true,
			expectToken:                 &login.UserAuth{OAuthExpiry: time.Now().Add(-10 * time.Minute)},
			expectedErr:                 authn.ErrExpiredAccessToken,
		},
		{
			desc:                        "should refresh the token successfully",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser, SessionToken: &auth.UserToken{}, AuthenticatedBy: login.AzureADAuthModule},
			expectTryRefreshTokenCalled: true,
			expectRevokeTokenCalled:     false,
		},
		{
			desc:                        "should not invalidate the token if the token has already been refreshed by another request (singleflight)",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser, SessionToken: &auth.UserToken{}, AuthenticatedBy: login.AzureADAuthModule},
			expectTryRefreshTokenCalled: true,
			expectRevokeTokenCalled:     false,
			expectToken:                 &login.UserAuth{OAuthExpiry: time.Now().Add(10 * time.Minute)},
		},
		{
			desc:                        "should not invalidate session if token refresh fails with no refresh token",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser, SessionToken: &auth.UserToken{}, AuthenticatedBy: login.AzureADAuthModule},
			expectedTryRefreshErr:       oauthtoken.ErrNoRefreshTokenFound,
			expectTryRefreshTokenCalled: true,
			expectRevokeTokenCalled:     false,
		},
		{
			desc:                        "should not invalidate session if token refresh lock retries are exhausted",
			identity:                    &authn.Identity{ID: "1", Type: claims.TypeUser, SessionToken: &auth.UserToken{}, AuthenticatedBy: login.AzureADAuthModule},
			expectedTryRefreshErr:       oauthtoken.ErrRetriesExhausted,
			expectTryRefreshTokenCalled: true,
			expectRevokeTokenCalled:     false,
			expectedErr:                 authn.ErrExpiredAccessToken,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			var (
				tryRefreshCalled  bool
				revokeTokenCalled bool
			)

			service := &oauthtokentest.MockOauthTokenService{
				TryTokenRefreshFunc: func(ctx context.Context, usr identity.Requester, _ *oauthtoken.TokenRefreshMetadata) (*oauth2.Token, error) {
					tryRefreshCalled = true
					return nil, tt.expectedTryRefreshErr
				},
			}

			sessionService := &authtest.FakeUserAuthTokenService{
				RevokeTokenProvider: func(ctx context.Context, token *auth.UserToken, soft bool) error {
					revokeTokenCalled = true
					return nil
				},
			}

			if tt.oauthInfo == nil {
				tt.oauthInfo = &social.OAuthInfo{
					UseRefreshToken: true,
				}
			}

			socialService := &socialtest.FakeSocialService{
				ExpectedAuthInfoProvider: tt.oauthInfo,
			}

			sync := &OAuthTokenSync{
				log:               log.NewNopLogger(),
				service:           service,
				sessionService:    sessionService,
				socialService:     socialService,
				singleflightGroup: new(singleflight.Group),
				tracer:            tracing.InitializeTracerForTest(),
				cache:             localcache.New(maxOAuthTokenCacheTTL, 15*time.Minute),
				features:          featuremgmt.WithFeatures(),
			}

			ctx := context.Background()
			reqCtx := context.WithValue(ctx, ctxkey.Key{}, &contextmodel.ReqContext{UserToken: nil})

			err := sync.SyncOauthTokenHook(reqCtx, tt.identity, nil)
			assert.ErrorIs(t, err, tt.expectedErr)
			assert.Equal(t, tt.expectTryRefreshTokenCalled, tryRefreshCalled)
			assert.Equal(t, tt.expectRevokeTokenCalled, revokeTokenCalled)
		})
	}
}

func TestOAuthTokenSync_SyncOAuthTokenHookCachesSuccessfulCheck(t *testing.T) {
	var refreshCalls atomic.Int32
	token := &oauth2.Token{AccessToken: "access", Expiry: time.Now().Add(time.Hour)}
	service := &oauthtokentest.MockOauthTokenService{
		TryTokenRefreshFunc: func(context.Context, identity.Requester, *oauthtoken.TokenRefreshMetadata) (*oauth2.Token, error) {
			refreshCalls.Add(1)
			return token, nil
		},
	}

	syncService := newOAuthTokenSyncForTest(service)
	id := &authn.Identity{
		ID:              "1",
		Type:            claims.TypeUser,
		SessionToken:    &auth.UserToken{Id: 1},
		AuthenticatedBy: login.AzureADAuthModule,
	}

	require.NoError(t, syncService.SyncOauthTokenHook(context.Background(), id, nil))
	require.NoError(t, syncService.SyncOauthTokenHook(context.Background(), id, nil))
	assert.Equal(t, int32(1), refreshCalls.Load())
}

func TestOAuthTokenSync_syncOAuthTokenRechecksCacheInsideSingleflight(t *testing.T) {
	var refreshCalls atomic.Int32
	service := &oauthtokentest.MockOauthTokenService{
		TryTokenRefreshFunc: func(context.Context, identity.Requester, *oauthtoken.TokenRefreshMetadata) (*oauth2.Token, error) {
			refreshCalls.Add(1)
			return &oauth2.Token{AccessToken: "access"}, nil
		},
	}

	syncService := newOAuthTokenSyncForTest(service)
	id := &authn.Identity{
		ID:              "1",
		Type:            claims.TypeUser,
		SessionToken:    &auth.UserToken{Id: 1},
		AuthenticatedBy: login.AzureADAuthModule,
	}
	cacheKey := "token-check-user:1"
	syncService.cache.Set(cacheKey, true, maxOAuthTokenCacheTTL)

	require.NoError(t, syncService.syncOAuthToken(context.Background(), id, cacheKey, log.NewNopLogger()))
	assert.Equal(t, int32(0), refreshCalls.Load())
}

func TestOAuthTokenSync_SyncOAuthTokenHookDeduplicatesConcurrentChecks(t *testing.T) {
	const requests = 20

	var refreshCalls atomic.Int32
	refreshStarted := make(chan struct{})
	releaseRefresh := make(chan struct{})
	token := &oauth2.Token{AccessToken: "access", Expiry: time.Now().Add(time.Hour)}
	service := &oauthtokentest.MockOauthTokenService{
		TryTokenRefreshFunc: func(context.Context, identity.Requester, *oauthtoken.TokenRefreshMetadata) (*oauth2.Token, error) {
			if refreshCalls.Add(1) == 1 {
				close(refreshStarted)
			}
			<-releaseRefresh
			return token, nil
		},
	}

	syncService := newOAuthTokenSyncForTest(service)
	id := &authn.Identity{
		ID:              "1",
		Type:            claims.TypeUser,
		SessionToken:    &auth.UserToken{Id: 1},
		AuthenticatedBy: login.AzureADAuthModule,
	}

	start := make(chan struct{})
	errs := make(chan error, requests)
	var wg sync.WaitGroup
	for range requests {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			errs <- syncService.SyncOauthTokenHook(context.Background(), id, nil)
		}()
	}

	close(start)
	<-refreshStarted
	// Give the released goroutines time to join the in-flight singleflight call.
	time.Sleep(50 * time.Millisecond)
	close(releaseRefresh)
	wg.Wait()
	close(errs)

	for err := range errs {
		require.NoError(t, err)
	}
	assert.Equal(t, int32(1), refreshCalls.Load())
}

func TestOAuthTokenSync_getOAuthTokenCacheTTL(t *testing.T) {
	now := time.Now()
	tests := []struct {
		name  string
		token *oauth2.Token
		want  time.Duration
	}{
		{
			name: "uses maximum TTL when token has no expiry",
			token: &oauth2.Token{
				AccessToken: "access",
			},
			want: maxOAuthTokenCacheTTL,
		},
		{
			name: "uses access token expiry with skew when sooner",
			token: &oauth2.Token{
				AccessToken: "access",
				Expiry:      now.Add(time.Minute),
			},
			want: time.Minute - oauthtoken.ExpiryDelta,
		},
		{
			name: "uses ID token expiry with skew when sooner",
			token: (&oauth2.Token{
				AccessToken: "access",
				Expiry:      now.Add(4 * time.Minute),
			}).WithExtra(map[string]any{
				"id_token": fakeIDToken(t, now.Add(2*time.Minute)),
			}),
			want: 2*time.Minute - oauthtoken.ExpiryDelta,
		},
		{
			name:  "uses maximum TTL for a nil token",
			token: nil,
			want:  maxOAuthTokenCacheTTL,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := getOAuthTokenCacheTTL(tt.token)
			assert.InDelta(t, tt.want.Seconds(), got.Seconds(), 1)
		})
	}
}

func newOAuthTokenSyncForTest(service oauthtoken.OAuthTokenService) *OAuthTokenSync {
	return &OAuthTokenSync{
		log:               log.NewNopLogger(),
		service:           service,
		sessionService:    &authtest.FakeUserAuthTokenService{},
		socialService:     &socialtest.FakeSocialService{},
		singleflightGroup: new(singleflight.Group),
		tracer:            tracing.InitializeTracerForTest(),
		cache:             localcache.New(maxOAuthTokenCacheTTL, 15*time.Minute),
		features:          featuremgmt.WithFeatures(),
	}
}

func fakeIDToken(t *testing.T, expiry time.Time) string {
	t.Helper()

	header, err := json.Marshal(map[string]string{"alg": "HS256"})
	require.NoError(t, err)
	payload, err := json.Marshal(map[string]int64{"exp": expiry.Unix()})
	require.NoError(t, err)

	return base64.RawURLEncoding.EncodeToString(header) + "." +
		base64.RawURLEncoding.EncodeToString(payload) + "." +
		base64.RawURLEncoding.EncodeToString([]byte("signature"))
}
