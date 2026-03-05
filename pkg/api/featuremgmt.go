package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	contextmodel "github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

func (hs *HTTPServer) GetFeatureFlags(_ *contextmodel.ReqContext) response.Response {
	flags, err := featuremgmt.GetFeatureFlags()
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to load feature flags", err)
	}

	return response.JSON(http.StatusOK, flags)
}
