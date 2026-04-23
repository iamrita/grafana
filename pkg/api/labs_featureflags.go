package api

import (
	"net/http"
	"slices"
	"strings"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/labs"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

// GetLabsFeatureFlags returns curated feature toggle metadata and runtime state for the Labs UI.
func (hs *HTTPServer) GetLabsFeatureFlags(c *contextmodel.ReqContext) response.Response {
	if !c.IsSignedIn {
		return response.Error(http.StatusUnauthorized, "Unauthorized", nil)
	}

	list, err := featuremgmt.GetEmbeddedFeatureList()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to load feature list", err)
	}

	enabled := hs.Features.GetEnabled(c.Req.Context())
	startupKeys := labsStartupConfiguredKeys(hs.Cfg)

	resp := labs.BuildLabsFeatureFlagsResponse(list, enabled, startupKeys)
	return response.JSON(http.StatusOK, resp)
}

func labsStartupConfiguredKeys(cfg *setting.Cfg) []string {
	if cfg == nil || cfg.Raw == nil {
		return nil
	}
	sec, err := cfg.Raw.GetSection("feature_toggles")
	if err != nil || sec == nil {
		return nil
	}
	out := make([]string, 0, 8)
	if v := sec.Key("enable"); v != nil {
		for _, name := range util.SplitString(v.String()) {
			name = strings.TrimSpace(name)
			if labs.IsLabsCuratedFlag(name) {
				out = append(out, name)
			}
		}
	}
	for _, k := range sec.Keys() {
		if k.Name() == "enable" {
			continue
		}
		if labs.IsLabsCuratedFlag(k.Name()) {
			out = append(out, k.Name())
		}
	}
	slices.Sort(out)
	return slices.Compact(out)
}
