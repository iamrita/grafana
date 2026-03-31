package api

import (
	"context"
	"fmt"
	"net/http"
	"sort"

	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type labsFlagCatalog interface {
	GetFlags() []featuremgmt.FeatureFlag
}

type labsResponse struct {
	Items []labsFeatureDTO `json:"items"`
}

type labsFeatureDTO struct {
	Name            string                       `json:"name"`
	Description     string                       `json:"description"`
	Stage           featuremgmt.FeatureFlagStage `json:"stage"`
	Owner           string                       `json:"owner"`
	Expression      string                       `json:"expression"`
	Enabled         bool                         `json:"enabled"`
	RequiresDevMode bool                         `json:"requiresDevMode,omitempty"`
	FrontendOnly    bool                         `json:"frontendOnly,omitempty"`
	HideFromDocs    bool                         `json:"hideFromDocs,omitempty"`
	RequiresRestart bool                         `json:"requiresRestart,omitempty"`
}

func (hs *HTTPServer) GetLabs(c *contextmodel.ReqContext) {
	response, err := hs.getLabs(c.Req.Context())
	if err != nil {
		c.JsonApiErr(http.StatusInternalServerError, "Failed to get labs", err)
		return
	}

	c.JSON(http.StatusOK, response)
}

func (hs *HTTPServer) getLabs(ctx context.Context) (*labsResponse, error) {
	catalog, ok := hs.Features.(labsFlagCatalog)
	if !ok {
		return nil, fmt.Errorf("feature toggle catalog unavailable")
	}

	flags := catalog.GetFlags()
	enabledFlags := hs.Features.GetEnabled(ctx)
	items := make([]labsFeatureDTO, 0, len(flags))

	for _, flag := range flags {
		items = append(items, labsFeatureDTO{
			Name:            flag.Name,
			Description:     flag.Description,
			Stage:           flag.Stage,
			Owner:           fmt.Sprint(flag.Owner),
			Expression:      flag.Expression,
			Enabled:         enabledFlags[flag.Name],
			RequiresDevMode: flag.RequiresDevMode,
			FrontendOnly:    flag.FrontendOnly,
			HideFromDocs:    flag.HideFromDocs,
			RequiresRestart: flag.RequiresRestart,
		})
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Name < items[j].Name
	})

	return &labsResponse{Items: items}, nil
}
