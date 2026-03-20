package api

import (
	"net/http"
	"slices"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type LabsFeature struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Owner           string `json:"owner"`
	Enabled         bool   `json:"enabled"`
	FrontendOnly    bool   `json:"frontendOnly"`
	RequiresRestart bool   `json:"requiresRestart"`
	RequiresDevMode bool   `json:"requiresDevMode"`
}

func (hs *HTTPServer) AdminGetLabsFeatures(c *contextmodel.ReqContext) response.Response {
	features, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to read feature flags metadata", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	out := make([]LabsFeature, 0, len(features.Items))

	for _, item := range features.Items {
		name := item.Name
		out = append(out, LabsFeature{
			Name:            name,
			Description:     item.Spec.Description,
			Stage:           item.Spec.Stage,
			Owner:           item.Spec.Owner,
			Enabled:         enabled[name],
			FrontendOnly:    item.Spec.FrontendOnly,
			RequiresRestart: item.Spec.RequiresRestart,
			RequiresDevMode: item.Spec.RequiresDevMode,
		})
	}

	slices.SortFunc(out, func(a, b LabsFeature) int {
		if a.Name < b.Name {
			return -1
		}
		if a.Name > b.Name {
			return 1
		}
		return 0
	})

	return response.JSON(http.StatusOK, out)
}
