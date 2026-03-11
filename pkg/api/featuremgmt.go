package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// FeatureFlagDTO represents a feature flag with its metadata for the frontend
type FeatureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Owner           string `json:"owner,omitempty"`
	Frontend        bool   `json:"frontend"`
	RequiresRestart bool   `json:"requiresRestart"`
	Expression      string `json:"expression"`
	Enabled         bool   `json:"enabled"`
}

// FeatureFlagsResponse is the response for the feature flags endpoint
type FeatureFlagsResponse struct {
	Flags []FeatureFlagDTO `json:"flags"`
}

func (hs *HTTPServer) registerFeatureMgmtRoutes(r routing.RouteRegister) {
	r.Group("/api/featuremgmt/v1", func(featureRoute routing.RouteRegister) {
		featureRoute.Get("/flags", routing.Wrap(hs.GetFeatureFlags))
	})
}

// swagger:route GET /featuremgmt/v1/flags featuremgmt getFeatureFlags
//
// Get all frontend-only feature flags with their metadata.
//
// Returns a list of feature flags that can be toggled via localStorage.
// Only frontend-only flags are returned as those are safe to toggle client-side.
//
// Responses:
// 200: getFeatureFlagsResponse
// 401: unauthorisedError
// 500: internalServerError
func (hs *HTTPServer) GetFeatureFlags(c *contextmodel.ReqContext) response.Response {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature flags", err)
	}

	// Get current enabled state
	enabledFlags := hs.Features.GetEnabled(c.Req.Context())

	var flags []FeatureFlagDTO
	for _, feature := range featureList.Items {
		// Only include frontend-only flags as specified in the plan
		if !feature.Spec.FrontendOnly {
			continue
		}

		// Skip flags that require dev mode in non-dev environments
		if feature.Spec.RequiresDevMode && hs.Cfg.Env != "development" {
			continue
		}

		// Skip deleted flags (those with deletionTimestamp set)
		if feature.ObjectMeta.DeletionTimestamp != nil {
			continue
		}

		enabled := enabledFlags[feature.ObjectMeta.Name]

		flags = append(flags, FeatureFlagDTO{
			Name:            feature.ObjectMeta.Name,
			Description:     feature.Spec.Description,
			Stage:           feature.Spec.Stage,
			Owner:           feature.Spec.Owner,
			Frontend:        feature.Spec.FrontendOnly,
			RequiresRestart: feature.Spec.RequiresRestart,
			Expression:      feature.Spec.Expression,
			Enabled:         enabled,
		})
	}

	return response.JSON(http.StatusOK, FeatureFlagsResponse{
		Flags: flags,
	})
}

// swagger:parameters getFeatureFlags
type GetFeatureFlagsParams struct{}

// swagger:response getFeatureFlagsResponse
type GetFeatureFlagsResponseWrapper struct {
	// in:body
	Body FeatureFlagsResponse
}
