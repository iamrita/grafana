package api

import (
	"encoding/json"
	"io"
	"net/http"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/web/webtest"
)

func TestGetFeatureToggles_Unauthenticated(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithFeatures()
	})

	req := server.NewGetRequest("/api/feature-toggles")
	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { require.NoError(t, res.Body.Close()) }()
	assert.Equal(t, http.StatusUnauthorized, res.StatusCode)
}

func TestGetFeatureToggles_AuthenticatedReturns200(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithManager("myTestFlag", true, "anotherFlag", false)
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/feature-toggles"),
		&user.SignedInUser{UserID: 1, OrgID: 1},
	)
	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { require.NoError(t, res.Body.Close()) }()
	assert.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var toggles []dtos.FeatureToggleDTO
	require.NoError(t, json.Unmarshal(body, &toggles))
	assert.NotEmpty(t, toggles)
}

func TestGetFeatureToggles_ResponseShape(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithManager("shapeTestFlag")
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/feature-toggles"),
		&user.SignedInUser{UserID: 1, OrgID: 1},
	)
	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { require.NoError(t, res.Body.Close()) }()
	require.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var raw []map[string]interface{}
	require.NoError(t, json.Unmarshal(body, &raw))
	require.NotEmpty(t, raw)

	item := raw[0]
	requiredFields := []string{"name", "description", "stage", "owner", "requiresDevMode", "frontendOnly", "requiresRestart", "enabled"}
	for _, field := range requiredFields {
		_, exists := item[field]
		assert.True(t, exists, "response item should have field %q", field)
	}
}

func TestGetFeatureToggles_EnabledReflectsState(t *testing.T) {
	server := SetupAPITestServer(t, func(hs *HTTPServer) {
		hs.Features = featuremgmt.WithManager("enabledFlag", true, "disabledFlag", false)
	})

	req := webtest.RequestWithSignedInUser(
		server.NewGetRequest("/api/feature-toggles"),
		&user.SignedInUser{UserID: 1, OrgID: 1},
	)
	res, err := server.Send(req)
	require.NoError(t, err)
	defer func() { require.NoError(t, res.Body.Close()) }()
	require.Equal(t, http.StatusOK, res.StatusCode)

	body, err := io.ReadAll(res.Body)
	require.NoError(t, err)

	var toggles []dtos.FeatureToggleDTO
	require.NoError(t, json.Unmarshal(body, &toggles))

	byName := map[string]dtos.FeatureToggleDTO{}
	for _, t := range toggles {
		byName[t.Name] = t
	}

	assert.True(t, byName["enabledFlag"].Enabled, "enabledFlag should be enabled")
	assert.False(t, byName["disabledFlag"].Enabled, "disabledFlag should be disabled")
}
