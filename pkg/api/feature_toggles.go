package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type featureFlagRegistry interface {
	GetFlags() []featuremgmt.FeatureFlag
}

func (hs *HTTPServer) GetFeatureToggles(c *contextmodel.ReqContext) response.Response {
	registry, ok := hs.Features.(featureFlagRegistry)
	if !ok {
		return response.Error(http.StatusInternalServerError, "feature flag registry not available", nil)
	}

	flags := registry.GetFlags()
	result := make([]dtos.FeatureToggleDTO, 0, len(flags))

	for _, f := range flags {
		result = append(result, dtos.FeatureToggleDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Owner:           string(f.Owner),
			RequiresDevMode: f.RequiresDevMode,
			FrontendOnly:    f.FrontendOnly,
			RequiresRestart: f.RequiresRestart,
			Enabled:         hs.Features.IsEnabledGlobally(f.Name),
		})
	}

	return response.JSON(http.StatusOK, result)
}
