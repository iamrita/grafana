package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type featureFlagDTO struct {
	Name            string `json:"name"`
	Description     string `json:"description"`
	Stage           string `json:"stage"`
	Enabled         bool   `json:"enabled"`
	RequiresDevMode bool   `json:"requiresDevMode,omitempty"`
	FrontendOnly    bool   `json:"frontendOnly,omitempty"`
	RequiresRestart bool   `json:"requiresRestart,omitempty"`
}

type featureFlagListResponse struct {
	Flags []featureFlagDTO `json:"flags"`
}

type featureFlagLister interface {
	GetFlags() []featuremgmt.FeatureFlag
}

func (hs *HTTPServer) GetFeatureFlags(c *contextmodel.ReqContext) response.Response {
	enabled := hs.Features.GetEnabled(c.Req.Context())

	lister, ok := hs.Features.(featureFlagLister)
	if !ok {
		return response.JSON(http.StatusOK, featureFlagListResponse{Flags: []featureFlagDTO{}})
	}

	flags := lister.GetFlags()
	sort.Slice(flags, func(i, j int) bool {
		return flags[i].Name < flags[j].Name
	})

	dtos := make([]featureFlagDTO, 0, len(flags))
	for _, f := range flags {
		if f.Name == "" {
			continue
		}
		dtos = append(dtos, featureFlagDTO{
			Name:            f.Name,
			Description:     f.Description,
			Stage:           f.Stage.String(),
			Enabled:         enabled[f.Name],
			RequiresDevMode: f.RequiresDevMode,
			FrontendOnly:    f.FrontendOnly,
			RequiresRestart: f.RequiresRestart,
		})
	}

	return response.JSON(http.StatusOK, featureFlagListResponse{Flags: dtos})
}
