package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

type fakeLabsFeatureCatalog struct {
	flags   []featuremgmt.FeatureFlag
	enabled map[string]bool
}

func (f fakeLabsFeatureCatalog) IsEnabled(_ context.Context, feature string) bool {
	return f.enabled[feature]
}

func (f fakeLabsFeatureCatalog) IsEnabledGlobally(feature string) bool {
	return f.enabled[feature]
}

func (f fakeLabsFeatureCatalog) GetEnabled(_ context.Context) map[string]bool {
	enabled := make(map[string]bool, len(f.enabled))
	for key, value := range f.enabled {
		enabled[key] = value
	}
	return enabled
}

func (f fakeLabsFeatureCatalog) GetFlags() []featuremgmt.FeatureFlag {
	return append([]featuremgmt.FeatureFlag(nil), f.flags...)
}

type fakeLabsFeatureTogglesNoCatalog struct{}

func (f fakeLabsFeatureTogglesNoCatalog) IsEnabled(_ context.Context, _ string) bool {
	return false
}

func (f fakeLabsFeatureTogglesNoCatalog) IsEnabledGlobally(_ string) bool {
	return false
}

func (f fakeLabsFeatureTogglesNoCatalog) GetEnabled(_ context.Context) map[string]bool {
	return map[string]bool{}
}

func TestGetLabs(t *testing.T) {
	t.Run("returns sorted feature metadata with enabled state for signed-in users", func(t *testing.T) {
		source := newFakeLabsFeatureCatalog(t)
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = source
		})

		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/labs"), &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleViewer,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusOK, resp.StatusCode)

		var body labsResponse
		require.NoError(t, json.NewDecoder(resp.Body).Decode(&body))
		require.NoError(t, resp.Body.Close())

		require.Equal(t, labsResponse{
			Items: []labsFeatureDTO{
				{
					Name:            source.flags[1].Name,
					Description:     source.flags[1].Description,
					Stage:           source.flags[1].Stage,
					Owner:           fmt.Sprint(source.flags[1].Owner),
					Expression:      source.flags[1].Expression,
					Enabled:         false,
					RequiresDevMode: source.flags[1].RequiresDevMode,
				},
				{
					Name:            source.flags[0].Name,
					Description:     source.flags[0].Description,
					Stage:           source.flags[0].Stage,
					Owner:           fmt.Sprint(source.flags[0].Owner),
					Expression:      source.flags[0].Expression,
					Enabled:         true,
					FrontendOnly:    source.flags[0].FrontendOnly,
					RequiresRestart: source.flags[0].RequiresRestart,
				},
			},
		}, body)
	})

	t.Run("requires a signed-in user", func(t *testing.T) {
		server := SetupAPITestServer(t)

		resp, err := server.Send(server.NewGetRequest("/api/labs"))
		require.NoError(t, err)
		require.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})

	t.Run("returns internal server error when feature catalog is unavailable", func(t *testing.T) {
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = fakeLabsFeatureTogglesNoCatalog{}
		})

		req := webtest.RequestWithSignedInUser(server.NewGetRequest("/api/labs"), &user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleViewer,
		})
		resp, err := server.Send(req)
		require.NoError(t, err)
		require.Equal(t, http.StatusInternalServerError, resp.StatusCode)
		require.NoError(t, resp.Body.Close())
	})
}

func newFakeLabsFeatureCatalog(t *testing.T) fakeLabsFeatureCatalog {
	t.Helper()

	manager, err := featuremgmt.ProvideManagerService(setting.NewCfg())
	require.NoError(t, err)

	flags := manager.GetFlags()
	require.GreaterOrEqual(t, len(flags), 2)

	alpha := flags[0]
	alpha.Name = "alphaFeature"
	alpha.Description = "Alpha labs feature"
	alpha.Stage = featuremgmt.FeatureStageExperimental
	alpha.Expression = "false"
	alpha.RequiresDevMode = true
	alpha.FrontendOnly = false
	alpha.RequiresRestart = false
	alpha.HideFromDocs = false

	beta := flags[1]
	beta.Name = "betaFeature"
	beta.Description = "Beta labs feature"
	beta.Stage = featuremgmt.FeatureStagePublicPreview
	beta.Expression = "true"
	beta.RequiresDevMode = false
	beta.FrontendOnly = true
	beta.RequiresRestart = true
	beta.HideFromDocs = false

	return fakeLabsFeatureCatalog{
		flags: []featuremgmt.FeatureFlag{beta, alpha},
		enabled: map[string]bool{
			"betaFeature": true,
		},
	}
}
