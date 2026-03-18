package api

import (
	"encoding/json"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestGetFeatureFlags(t *testing.T) {
	t.Run("returns feature flags with metadata", func(t *testing.T) {
		fm := featuremgmt.WithManager("testFeatureA", true, "testFeatureB", false)
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = fm
		})

		req := server.NewGetRequest("/api/featuremgmt/flags")
		webtest.RequestWithSignedInUser(req, userWithPermissions(1, nil))

		resp, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result featureFlagListResponse
		err = json.NewDecoder(resp.Body).Decode(&result)
		require.NoError(t, err)
		require.NotEmpty(t, result.Flags)

		flagMap := make(map[string]featureFlagDTO)
		for _, f := range result.Flags {
			flagMap[f.Name] = f
		}

		assert.True(t, flagMap["testFeatureA"].Enabled)
		assert.False(t, flagMap["testFeatureB"].Enabled)
	})

	t.Run("returns sorted flags", func(t *testing.T) {
		fm := featuremgmt.WithManager("zFlag", true, "aFlag", false)
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = fm
		})

		req := server.NewGetRequest("/api/featuremgmt/flags")
		webtest.RequestWithSignedInUser(req, userWithPermissions(1, nil))

		resp, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result featureFlagListResponse
		err = json.NewDecoder(resp.Body).Decode(&result)
		require.NoError(t, err)
		require.Len(t, result.Flags, 2)
		assert.Equal(t, "aFlag", result.Flags[0].Name)
		assert.Equal(t, "zFlag", result.Flags[1].Name)
	})

	t.Run("returns empty list when no flags are registered", func(t *testing.T) {
		fm := featuremgmt.WithManager()
		server := SetupAPITestServer(t, func(hs *HTTPServer) {
			hs.Features = fm
		})

		req := server.NewGetRequest("/api/featuremgmt/flags")
		webtest.RequestWithSignedInUser(req, userWithPermissions(1, nil))

		resp, err := server.Send(req)
		require.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var result featureFlagListResponse
		err = json.NewDecoder(resp.Body).Decode(&result)
		require.NoError(t, err)
		assert.Empty(t, result.Flags)
	})
}
