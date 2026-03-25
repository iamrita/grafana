package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

// labsFeatureFlagDTO is the Labs page payload for a single feature toggle.
type labsFeatureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Owner           string `json:"owner,omitempty"`
	Enabled         bool   `json:"enabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	Warning         string `json:"warning,omitempty"`
}

type labsFeatureFlagsResponse struct {
	Flags []labsFeatureFlagDTO `json:"flags"`
}

// GetLabsFeatureFlags returns embedded registry metadata and current enabled state for the Labs UI.
//
// swagger:response getLabsFeatureFlagsResponse
// GET /api/featuremgmt/flags
func (hs *HTTPServer) GetLabsFeatureFlags(c *contextmodel.ReqContext) response.Response {
	list, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to load feature toggle registry", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	out := make([]labsFeatureFlagDTO, 0, len(list.Items))

	for _, item := range list.Items {
		if item.DeletionTimestamp != nil {
			continue
		}
		name := item.Name
		if name == "" {
			continue
		}

		dto := labsFeatureFlagDTO{
			Name:            name,
			Description:     item.Spec.Description,
			Stage:           item.Spec.Stage,
			Owner:           item.Spec.Owner,
			Enabled:         enabled[name],
			FrontendOnly:    item.Spec.FrontendOnly,
			RequiresRestart: item.Spec.RequiresRestart,
		}

		switch {
		case item.Spec.RequiresRestart:
			dto.Warning = "May require a server restart to take full effect."
		case !item.Spec.FrontendOnly:
			dto.Warning = "Server-evaluated flag: browser toggle affects the UI only; APIs may still use server configuration until reload."
		}

		out = append(out, dto)
	}

	return response.JSON(http.StatusOK, labsFeatureFlagsResponse{Flags: out})
}
