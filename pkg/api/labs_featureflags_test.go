package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/labs"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

func TestGetLabsFeatureFlags_signedIn(t *testing.T) {
	cfg := setting.NewCfg()
	_, err := cfg.Raw.NewSection("feature_toggles")
	require.NoError(t, err)
	_, err = cfg.Raw.Section("feature_toggles").NewKey("influxdbBackendMigration", "false")
	require.NoError(t, err)

	sc := setupScenarioContext(t, "/api/labs/feature-flags")
	hs := &HTTPServer{
		Cfg:      cfg,
		Features: featuremgmt.WithFeatures("publicDashboardsScene", "influxdbBackendMigration"),
	}
	sc.defaultHandler = routing.Wrap(func(c *contextmodel.ReqContext) response.Response {
		c.IsSignedIn = true
		c.SignedInUser = &user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: org.RoleViewer}
		return hs.GetLabsFeatureFlags(c)
	})
	sc.m.Get("/api/labs/feature-flags", sc.defaultHandler)

	sc.fakeReq(http.MethodGet, sc.url).exec()

	require.Equal(t, http.StatusOK, sc.resp.Code)
	var got labs.LabsFeatureFlagsResponse
	require.NoError(t, json.Unmarshal(sc.resp.Body.Bytes(), &got))
	require.GreaterOrEqual(t, len(got.Flags), 2)
}

func TestGetLabsFeatureFlags_unauthorizedWhenNotSignedIn(t *testing.T) {
	sc := setupScenarioContext(t, "/api/labs/feature-flags")
	hs := &HTTPServer{Cfg: setting.NewCfg(), Features: featuremgmt.WithFeatures()}
	sc.defaultHandler = routing.Wrap(func(c *contextmodel.ReqContext) response.Response {
		c.IsSignedIn = false
		return hs.GetLabsFeatureFlags(c)
	})
	sc.m.Get("/api/labs/feature-flags", sc.defaultHandler)

	sc.fakeReq(http.MethodGet, sc.url).exec()

	require.Equal(t, http.StatusUnauthorized, sc.resp.Code)
}
