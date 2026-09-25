package api

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestListExperimentalFeatureToggles(t *testing.T) {
	flags := []featuremgmt.FeatureFlag{
		{
			Name:         "hiddenExp",
			Description:  "hidden",
			Stage:        featuremgmt.FeatureStageExperimental,
			Owner:        "@grafana/identity-access-team",
			HideFromDocs: true,
			Expression:   "false",
		},
		{
			Name:       "gaFlag",
			Stage:      featuremgmt.FeatureStageGeneralAvailability,
			Expression: "true",
		},
		{
			Name:        "expOn",
			Description: "on",
			Stage:       featuremgmt.FeatureStageExperimental,
			Owner:       "@grafana/oss-big-tent",
		},
		{
			Name:  "unknown",
			Stage: featuremgmt.FeatureStageUnknown,
		},
	}
	enabled := map[string]bool{
		"expOn":        true,
		"gaFlag":       true,
		"notARealFlag": true,
	}

	got := listExperimentalFeatureToggles(flags, func(name string) bool {
		return enabled[name]
	})

	require.Equal(t, []experimentalFeatureToggle{
		{
			Name:        "expOn",
			Description: "on",
			Owner:       "@grafana/oss-big-tent",
			Stage:       "experimental",
			Enabled:     true,
		},
		{
			Name:        "hiddenExp",
			Description: "hidden",
			Owner:       "@grafana/identity-access-team",
			Stage:       "experimental",
			Enabled:     false,
		},
	}, got)
}

func TestGetExperimentalFeatureToggles(t *testing.T) {
	t.Run("reader receives experimental toggles only", func(t *testing.T) {
		server := featureToggleAPIServer(t, featuremgmt.FlagExperimentalFeatureTogglesAdmin, "lokiExperimentalStreaming")

		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/admin/feature-toggles"),
			authedUserWithPermissions(1, 1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}}),
		))
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		require.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)

		var payload experimentalFeatureTogglesResponse
		require.NoError(t, json.Unmarshal(body, &payload))
		assert.False(t, payload.AllowEditing)
		require.NotEmpty(t, payload.Toggles)

		byName := map[string]experimentalFeatureToggle{}
		for _, toggle := range payload.Toggles {
			assert.Equal(t, "experimental", toggle.Stage)
			byName[toggle.Name] = toggle
		}
		require.Contains(t, byName, "lokiExperimentalStreaming")
		assert.True(t, byName["lokiExperimentalStreaming"].Enabled)
		assert.Equal(t, "@grafana/oss-big-tent", byName["lokiExperimentalStreaming"].Owner)
		require.Contains(t, byName, "starsFromAPIServer")
		assert.False(t, byName["starsFromAPIServer"].Enabled)
		assert.NotContains(t, byName, "featureHighlights")
		assert.NotContains(t, byName, "notARealFlag")
		assert.NotContains(t, string(body), `"expression"`)
	})

	t.Run("org admin without featuremgmt.read is forbidden", func(t *testing.T) {
		server := featureToggleAPIServer(t, featuremgmt.FlagExperimentalFeatureTogglesAdmin)
		admin := &user.SignedInUser{
			UserID:      1,
			OrgID:       1,
			OrgRole:     org.RoleAdmin,
			Permissions: map[int64]map[string][]string{1: {}},
		}

		res, err := server.Send(webtest.RequestWithSignedInUser(server.NewGetRequest("/api/admin/feature-toggles"), admin))
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		assert.Equal(t, http.StatusForbidden, res.StatusCode)
	})

	t.Run("anonymous caller is unauthorized even with the read action", func(t *testing.T) {
		server := featureToggleAPIServer(t, featuremgmt.FlagExperimentalFeatureTogglesAdmin)
		req := server.NewGetRequest("/api/admin/feature-toggles")
		webtest.RequestWithWebContext(req, &contextmodel.ReqContext{
			SignedInUser: &user.SignedInUser{
				IsAnonymous: true,
				OrgID:       1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionFeatureManagementRead: {}},
				},
			},
			IsSignedIn:     false,
			AllowAnonymous: true,
		})

		res, err := server.Send(req)
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})

	t.Run("missing session is unauthorized", func(t *testing.T) {
		server := featureToggleAPIServer(t, featuremgmt.FlagExperimentalFeatureTogglesAdmin)
		res, err := server.Send(server.NewGetRequest("/api/admin/feature-toggles"))
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
	})

	t.Run("toggle disabled keeps the route unregistered", func(t *testing.T) {
		server := featureToggleAPIServer(t)
		res, err := server.Send(webtest.RequestWithSignedInUser(
			server.NewGetRequest("/api/admin/feature-toggles"),
			authedUserWithPermissions(1, 1, []accesscontrol.Permission{{Action: accesscontrol.ActionFeatureManagementRead}}),
		))
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		assert.Equal(t, http.StatusNotFound, res.StatusCode)
	})

	t.Run("write methods are not registered", func(t *testing.T) {
		server := featureToggleAPIServer(t, featuremgmt.FlagExperimentalFeatureTogglesAdmin)
		req := server.NewRequest(http.MethodPost, "/api/admin/feature-toggles", nil)
		res, err := server.Send(webtest.RequestWithSignedInUser(
			req,
			authedUserWithPermissions(1, 1, []accesscontrol.Permission{
				{Action: accesscontrol.ActionFeatureManagementRead},
				{Action: accesscontrol.ActionFeatureManagementWrite},
			}),
		))
		require.NoError(t, err)
		defer func() { require.NoError(t, res.Body.Close()) }()
		assert.Equal(t, http.StatusNotFound, res.StatusCode)
	})
}

func featureToggleAPIServer(t *testing.T, enabled ...string) *webtest.Server {
	t.Helper()

	cfg := setting.NewCfg()
	section, err := cfg.Raw.NewSection("feature_toggles")
	require.NoError(t, err)
	_, err = section.NewKey("enable", strings.Join(append(enabled, "notARealFlag"), ","))
	require.NoError(t, err)

	manager, err := featuremgmt.ProvideManagerService(cfg)
	require.NoError(t, err)

	return SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Cfg = cfg
		hs.Features = manager
	})
}
