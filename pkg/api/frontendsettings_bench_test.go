package api

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"
	"time"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/remotecache"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/login/social/socialimpl"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/config"
	"github.com/grafana/grafana/pkg/plugins/manager/pluginfakes"
	"github.com/grafana/grafana/pkg/plugins/manager/registry"
	"github.com/grafana/grafana/pkg/plugins/manager/signature"
	"github.com/grafana/grafana/pkg/plugins/manager/signature/statickey"
	"github.com/grafana/grafana/pkg/plugins/pluginassets/modulehash"
	"github.com/grafana/grafana/pkg/plugins/pluginscdn"
	accesscontrolmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/services/apiserver/endpoints/request"
	"github.com/grafana/grafana/pkg/services/authn/authntest"
	"github.com/grafana/grafana/pkg/services/contexthandler/model"
	"github.com/grafana/grafana/pkg/services/datasources"
	datafakes "github.com/grafana/grafana/pkg/services/datasources/fakes"
	"github.com/grafana/grafana/pkg/services/datasources/guardian"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/licensing"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/managedplugins"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginassets"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginsettings"
	"github.com/grafana/grafana/pkg/services/pluginsintegration/pluginstore"
	"github.com/grafana/grafana/pkg/services/rendering"
	"github.com/grafana/grafana/pkg/services/ssosettings/ssosettingstests"
	"github.com/grafana/grafana/pkg/services/supportbundles/supportbundlestest"
	"github.com/grafana/grafana/pkg/services/updatemanager"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

// Run with:
// go test -bench=BenchmarkGetFrontendSettings -run=^$ ./pkg/api/
func BenchmarkGetFrontendSettings(b *testing.B) {
	start := time.Now()
	b.Log("setup start")

	benchmarks := []struct {
		desc         string
		pluginCount  int
		datasourceCount int
	}{
		{
			desc:            "small-org",
			pluginCount:     5,
			datasourceCount: 2,
		},
		{
			desc:            "large-org",
			pluginCount:     50,
			datasourceCount: 20,
		},
	}

	for _, bm := range benchmarks {
		b.Run(bm.desc, func(b *testing.B) {
			hs, c := setupFrontendSettingsBenchmark(b, bm.pluginCount, bm.datasourceCount)
			b.Log("setup time:", time.Since(start))
			b.ResetTimer()

			for i := 0; i < b.N; i++ {
				settings, err := hs.getFrontendSettings(c)
				require.NoError(b, err)
				require.NotNil(b, settings)
				require.GreaterOrEqual(b, len(settings.Datasources), bm.datasourceCount)
				require.NotEmpty(b, settings.Panels)
			}
		})
	}
}

func setupFrontendSettingsBenchmark(b *testing.B, pluginCount, datasourceCount int) (*HTTPServer, *contextmodel.ReqContext) {
	b.Helper()

	cfg := setting.NewCfg()
	features := featuremgmt.WithFeatures()
	cfg.IsFeatureToggleEnabled = features.IsEnabledGlobally

	pluginStore, pluginSettings := buildBenchmarkPluginStore(pluginCount)
	dataSourcesService := buildBenchmarkDataSourceService(datasourceCount)

	pluginsCfg := &config.PluginManagementCfg{
		PluginsCDNURLTemplate: cfg.PluginsCDNURLTemplate,
		PluginSettings:        cfg.PluginSettings,
	}
	pluginsCDN := pluginscdn.ProvideService(pluginsCfg)
	sig := signature.ProvideService(pluginsCfg, statickey.New())
	calc := modulehash.NewCalculator(pluginsCfg, registry.NewInMemory(), pluginsCDN, sig)
	pluginsAssets := pluginassets.ProvideService(calc)

	hs := &HTTPServer{
		authnService:          &authntest.FakeService{},
		Cfg:                   cfg,
		Features:              features,
		License:               &licensing.OSSLicensingService{Cfg: cfg},
		RenderService:         &rendering.RenderingService{Cfg: cfg, RendererPluginManager: &fakeRendererPluginManager{}},
		SQLStore:              db.InitTestDB(b),
		SettingsProvider:      setting.ProvideProvider(cfg),
		pluginStore:           pluginStore,
		grafanaUpdateChecker:  &updatemanager.GrafanaService{},
		AccessControl:         accesscontrolmock.New(),
		PluginSettings:        pluginSettings,
		pluginsCDNService:     pluginsCDN,
		pluginAssets:          pluginsAssets,
		namespacer:            request.GetNamespaceMapper(cfg),
		SocialService:         socialimpl.ProvideService(cfg, features, &usagestats.UsageStatsMock{}, supportbundlestest.NewFakeBundleService(), remotecache.NewFakeCacheStorage(), nil, ssosettingstests.NewFakeService()),
		managedPluginsService: managedplugins.NewNoop(),
		tracer:                tracing.InitializeTracerForTest(),
		DataSourcesService:    dataSourcesService,
		dsGuardian:            guardian.ProvideGuardian(),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/frontend/settings/", nil)
	rec := httptest.NewRecorder()
	c := &contextmodel.ReqContext{
		Context: &web.Context{
			Req:  req,
			Resp: web.NewResponseWriter(http.MethodGet, rec),
		},
		SignedInUser: &user.SignedInUser{
			OrgID:   1,
			UserID:  1,
			OrgRole: org.RoleAdmin,
		},
		IsSignedIn: true,
	}

	return hs, c
}

func buildBenchmarkPluginStore(pluginCount int) (pluginstore.Store, pluginsettings.Service) {
	pluginList := make([]pluginstore.Plugin, 0, pluginCount+1)
	pluginSettingsMap := make(map[string]*pluginsettings.DTO, pluginCount+1)

	pluginList = append(pluginList, pluginstore.Plugin{
		Module:          "/prometheus/module.js",
		FS:              &pluginfakes.FakePluginFS{},
		LoadingStrategy: plugins.LoadingStrategyScript,
		JSONData: plugins.JSONData{
			ID:   "prometheus",
			Name: "Prometheus",
			Type: plugins.TypeDataSource,
			Info: plugins.Info{Version: "1.0.0"},
		},
	})
	pluginSettingsMap["prometheus"] = &pluginsettings.DTO{
		PluginID: "prometheus",
		OrgID:    1,
		Enabled:  true,
	}

	for i := 0; i < pluginCount; i++ {
		pluginType := plugins.TypePanel
		switch {
		case i%5 == 0:
			pluginType = plugins.TypeApp
		case i%3 == 0:
			pluginType = plugins.TypeDataSource
		}

		id := fmt.Sprintf("bench-plugin-%d", i)
		pluginList = append(pluginList, pluginstore.Plugin{
			Module:          filepath.Join("/", id, "module.js"),
			FS:              &pluginfakes.FakePluginFS{},
			LoadingStrategy: plugins.LoadingStrategyScript,
			JSONData: plugins.JSONData{
				ID:   id,
				Name: id,
				Type: pluginType,
				Info: plugins.Info{Version: "1.0.0"},
			},
		})
		pluginSettingsMap[id] = &pluginsettings.DTO{
			PluginID: id,
			OrgID:    1,
			Enabled:  true,
		}
	}

	return pluginstore.NewFakePluginStore(pluginList...), &pluginsettings.FakePluginSettings{Plugins: pluginSettingsMap}
}

func buildBenchmarkDataSourceService(datasourceCount int) *datafakes.FakeDataSourceService {
	dataSources := make([]*datasources.DataSource, 0, datasourceCount)
	for i := 0; i < datasourceCount; i++ {
		dataSources = append(dataSources, &datasources.DataSource{
			ID:     int64(i + 1),
			OrgID:  1,
			UID:    fmt.Sprintf("bench-ds-%d", i),
			Name:   fmt.Sprintf("bench-ds-%d", i),
			Type:   "prometheus",
			URL:    "http://localhost:9090",
			Access: datasources.DS_ACCESS_PROXY,
			JsonData: simplejson.NewFromAny(map[string]any{
				"httpMethod": "POST",
			}),
		})
	}

	return &datafakes.FakeDataSourceService{DataSources: dataSources}
}
