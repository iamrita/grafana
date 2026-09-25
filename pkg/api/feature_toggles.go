package api

import (
	"net/http"
	"sort"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

type experimentalFeatureToggle struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	Stage       string `json:"stage"`
	Enabled     bool   `json:"enabled"`
}

type experimentalFeatureTogglesResponse struct {
	// Always false. A missing field would let a client invent a write path.
	AllowEditing bool                        `json:"allowEditing"`
	Toggles      []experimentalFeatureToggle `json:"toggles"`
}

type featureFlagCatalog interface {
	GetFlags() []featuremgmt.FeatureFlag
}

// GetExperimentalFeatureToggles lists experimental feature toggles.
// Enabled state is the server-wide startup value. Browser and per-user
// overrides are not included, so this list cannot be mistaken for one session.
func (hs *HTTPServer) GetExperimentalFeatureToggles(c *contextmodel.ReqContext) response.Response {
	catalog, ok := hs.Features.(featureFlagCatalog)
	if !ok {
		return response.Error(http.StatusInternalServerError, "Feature catalog unavailable", nil)
	}

	return response.JSON(http.StatusOK, experimentalFeatureTogglesResponse{
		AllowEditing: false,
		Toggles:      listExperimentalFeatureToggles(catalog.GetFlags(), hs.Features.IsEnabledGlobally),
	})
}

func listExperimentalFeatureToggles(flags []featuremgmt.FeatureFlag, enabled func(string) bool) []experimentalFeatureToggle {
	out := make([]experimentalFeatureToggle, 0)
	for _, flag := range flags {
		// Preview and GA flags stay out of this surface. Unknown config keys
		// have no experimental stage, so they are not echoed back.
		if flag.Stage != featuremgmt.FeatureStageExperimental {
			continue
		}
		out = append(out, experimentalFeatureToggle{
			Name:        flag.Name,
			Description: flag.Description,
			Owner:       string(flag.Owner),
			Stage:       flag.Stage.String(),
			Enabled:     enabled(flag.Name),
		})
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].Name < out[j].Name
	})
	return out
}
