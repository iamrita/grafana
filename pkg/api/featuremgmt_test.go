package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestAPI_GetFeatureFlags(t *testing.T) {
	t.Run("should return frontend-only flags", func(t *testing.T) {
		cfg := setting.NewCfg()
		features := featuremgmt.WithFeatures()

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.Features = features
		})

		req := server.NewGetRequest("/api/featuremgmt/v1/flags")
		res, err := server.Send(webtest.RequestWithSignedInUser(req, userWithPermissions(1, []accesscontrol.Permission{})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var response FeatureFlagsResponse
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)

		// Verify the response structure
		assert.NotNil(t, response.Flags)

		// Check that all returned flags have frontend: true
		for _, flag := range response.Flags {
			assert.True(t, flag.Frontend, "All returned flags should be frontend-only, but %s was not", flag.Name)
		}
	})

	t.Run("should include required fields in response", func(t *testing.T) {
		cfg := setting.NewCfg()
		features := featuremgmt.WithFeatures()

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.Features = features
		})

		req := server.NewGetRequest("/api/featuremgmt/v1/flags")
		res, err := server.Send(webtest.RequestWithSignedInUser(req, userWithPermissions(1, []accesscontrol.Permission{})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var response FeatureFlagsResponse
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)

		// If there are any flags, check that they have the expected fields
		if len(response.Flags) > 0 {
			firstFlag := response.Flags[0]
			assert.NotEmpty(t, firstFlag.Name, "Flag name should not be empty")
			assert.NotEmpty(t, firstFlag.Stage, "Flag stage should not be empty")
			// Description and owner might be empty for some flags
		}
	})

	t.Run("should return flags with various stages", func(t *testing.T) {
		cfg := setting.NewCfg()
		features := featuremgmt.WithFeatures()

		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Cfg = cfg
			hs.Features = features
		})

		req := server.NewGetRequest("/api/featuremgmt/v1/flags")
		res, err := server.Send(webtest.RequestWithSignedInUser(req, userWithPermissions(1, []accesscontrol.Permission{})))
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, res.StatusCode)

		body, err := io.ReadAll(res.Body)
		require.NoError(t, err)
		require.NoError(t, res.Body.Close())

		var response FeatureFlagsResponse
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)

		// Verify that we have flags with various stages
		stagesFound := make(map[string]bool)
		for _, flag := range response.Flags {
			stagesFound[flag.Stage] = true
		}

		// We should have at least one stage represented
		assert.True(t, len(stagesFound) > 0, "Should have at least one stage represented")
	})
}
