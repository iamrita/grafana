package api

import (
	"net/http"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// FeatureFlagDTO represents a feature flag with its metadata.
type FeatureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
}

// GetFeatureFlagsResponse is the response for the GetFeatureFlags endpoint.
type GetFeatureFlagsResponse struct {
	Flags []FeatureFlagDTO `json:"flags"`
}

// GetFeatureFlags returns all feature flags with their metadata and current enabled state.
func (hs *HTTPServer) GetFeatureFlags(c *contextmodel.ReqContext) {
	featureList, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		c.JsonApiErr(http.StatusInternalServerError, "Failed to get feature flags", err)
		return
	}

	enabledFlags := hs.Features.GetEnabled(c.Req.Context())

	flags := make([]FeatureFlagDTO, 0, len(featureList.Items))
	for _, feature := range featureList.Items {
		flags = append(flags, FeatureFlagDTO{
			Name:            feature.ObjectMeta.Name,
			Description:     feature.Spec.Description,
			Stage:           feature.Spec.Stage,
			Enabled:         enabledFlags[feature.ObjectMeta.Name],
			RequiresDevMode: feature.Spec.RequiresDevMode,
			FrontendOnly:    feature.Spec.FrontendOnly,
			RequiresRestart: feature.Spec.RequiresRestart,
		})
	}

	c.JSON(http.StatusOK, GetFeatureFlagsResponse{Flags: flags})
}
