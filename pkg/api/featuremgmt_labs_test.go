package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestIntegration_GetLabsFeatureFlags_returnsRegistryAndEnabledState(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithFeatures("adHocFilterDefaultValues")
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/featuremgmt/flags"),
		&user.SignedInUser{UserID: 1, OrgID: 1, OrgRole: "Editor"},
	)
	res, err := server.Send(req)
	require.NoError(t, err)
	defer res.Body.Close()

	require.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var parsed struct {
		Flags []struct {
			Name            string `json:"name"`
			FrontendOnly    bool   `json:"frontendOnly"`
			Enabled         bool   `json:"enabled"`
			RequiresRestart bool   `json:"requiresRestart"`
		} `json:"flags"`
	}
	require.NoError(t, json.Unmarshal(body, &parsed))
	require.NotEmpty(t, parsed.Flags)

	var adHoc *struct {
		Name            string `json:"name"`
		FrontendOnly    bool   `json:"frontendOnly"`
		Enabled         bool   `json:"enabled"`
		RequiresRestart bool   `json:"requiresRestart"`
	}
	for i := range parsed.Flags {
		if parsed.Flags[i].Name == "adHocFilterDefaultValues" {
			c := parsed.Flags[i]
			adHoc = &c
			break
		}
	}
	require.NotNil(t, adHoc, "expected embedded registry to contain adHocFilterDefaultValues")
	require.True(t, adHoc.FrontendOnly)
	require.True(t, adHoc.Enabled)
}
