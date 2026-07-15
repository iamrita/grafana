package api

import (
	"path/filepath"

	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/middleware/requestmeta"
	"github.com/grafana/grafana/pkg/web"
)

type middlewareRegistration struct {
	name         string
	registration string
	condition    string
	description  string
	apply        func(*HTTPServer, *web.Mux)
}

// middlewareRegistrationTable is the source of truth for the global HTTP
// middleware pipeline. The order of entries is the order in which middleware
// is registered and executed.
var middlewareRegistrationTable = []middlewareRegistration{
	{
		name:         "requestmeta.SetupRequestMetadata",
		registration: "Use",
		condition:    "Always",
		description:  "Initializes request metadata used by later middleware.",
		apply: func(_ *HTTPServer, m *web.Mux) {
			m.Use(requestmeta.SetupRequestMetadata())
		},
	},
	{
		name:         "middleware.RequestTracing",
		registration: "Use",
		condition:    "Always",
		description:  "Creates and names the trace span for the request.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.Use(middleware.RequestTracing(hs.tracer, middleware.ShouldTraceWithExceptions))
		},
	},
	{
		name:         "middleware.RequestMetrics",
		registration: "Use",
		condition:    "Always",
		description:  "Records request count, status, and duration metrics.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.Use(middleware.RequestMetrics(hs.Features, hs.Cfg, hs.promRegister))
		},
	},
	{
		name:         "LoggerMiddleware.Middleware",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Adds structured request logging.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(hs.LoggerMiddleware.Middleware())
		},
	},
	{
		name:         "middleware.Gziper",
		registration: "UseMiddleware",
		condition:    "server.enable_gzip is enabled",
		description:  "Compresses eligible HTTP responses.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			if hs.Cfg.EnableGzip {
				m.UseMiddleware(middleware.Gziper())
			}
		},
	},
	{
		name:         "middleware.Recovery",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Recovers from panics and returns an HTTP 500 response.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(middleware.Recovery(hs.Cfg, hs.License))
		},
	},
	{
		name:         "Csrf.Middleware",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Validates cross-site request forgery protections.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(hs.Csrf.Middleware())
		},
	},
	{
		name:         "HTTPServer.mapStatic",
		registration: "Use",
		condition:    "Standard assets are always registered; local image uploads require a local image provider",
		description:  "Serves static assets, robots.txt, the mock service worker, and local image uploads.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			hs.mapStatic(m, hs.Cfg.StaticRootPath, "build", "public/build")
			hs.mapStatic(m, hs.Cfg.StaticRootPath, "", "public", "/public/views/swagger.html")
			hs.mapStatic(m, hs.Cfg.StaticRootPath, "robots.txt", "robots.txt")
			hs.mapStatic(m, hs.Cfg.StaticRootPath, "mockServiceWorker.js", "mockServiceWorker.js")

			if hs.Cfg.ImageUploadProvider == "local" {
				hs.mapStatic(m, hs.Cfg.ImagesDir, "", "/public/img/attachments")
			}
		},
	},
	{
		name:         "middleware.AddCustomResponseHeaders",
		registration: "Use",
		condition:    "server.custom_response_headers contains at least one header",
		description:  "Adds configured response headers.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			if len(hs.Cfg.CustomResponseHeaders) > 0 {
				m.Use(middleware.AddCustomResponseHeaders(hs.Cfg))
			}
		},
	},
	{
		name:         "middleware.AddDefaultResponseHeaders",
		registration: "Use",
		condition:    "Always",
		description:  "Adds Grafana's default response headers.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.Use(middleware.AddDefaultResponseHeaders(hs.Cfg))
		},
	},
	{
		name:         "middleware.SubPathRedirect",
		registration: "UseMiddleware",
		condition:    "server.serve_from_sub_path is enabled and app_sub_url is set",
		description:  "Redirects requests to Grafana's configured application sub-path.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			if hs.Cfg.ServeFromSubPath && hs.Cfg.AppSubURL != "" {
				m.SetURLPrefix(hs.Cfg.AppSubURL)
				m.UseMiddleware(middleware.SubPathRedirect(hs.Cfg))
			}
		},
	},
	{
		name:         "web.Renderer",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Configures HTML template rendering.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(web.Renderer(filepath.Join(hs.Cfg.StaticRootPath, "views"), "[[", "]]"))
		},
	},
	{
		name:         "HTTPServer monitoring endpoints",
		registration: "Use",
		condition:    "Always",
		description:  "Handles health, metrics, plugin metrics, and frontend log endpoints before authentication redirects.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.Use(hs.healthzHandler)
			m.Use(hs.apiHealthHandler)
			m.Use(hs.metricsEndpoint)
			m.Use(hs.pluginMetricsEndpoint)
			m.Use(hs.frontendLogEndpoints())
		},
	},
	{
		name:         "ContextHandler.Middleware",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Authenticates the request and adds user and organization context.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(hs.ContextHandler.Middleware)
		},
	},
	{
		name:         "middleware.OrgRedirect",
		registration: "Use",
		condition:    "Always",
		description:  "Redirects requests when the selected organization is invalid.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.Use(middleware.OrgRedirect(hs.Cfg, hs.userService))
		},
	},
	{
		name:         "middleware.ValidateHostHeader",
		registration: "Use",
		condition:    "server.enforce_domain is enabled",
		description:  "Rejects host headers that don't match the configured domain.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			if hs.Cfg.EnforceDomain {
				m.Use(middleware.ValidateHostHeader(hs.Cfg))
			}
		},
	},
	{
		name:         "middleware.ValidateActionUrl",
		registration: "UseMiddleware",
		condition:    "Always",
		description:  "Validates action URL parameters after request context is available.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			m.UseMiddleware(middleware.ValidateActionUrl(hs.Cfg, hs.log))
		},
	},
	{
		name:         "middleware.HandleNoCacheHeaders",
		registration: "Use",
		condition:    "Always",
		description:  "Applies no-cache response headers when the request requires them.",
		apply: func(_ *HTTPServer, m *web.Mux) {
			m.Use(middleware.HandleNoCacheHeaders)
		},
	},
	{
		name:         "middleware.ContentSecurityPolicy",
		registration: "UseMiddleware",
		condition:    "server.content_security_policy or server.content_security_policy_report_only is enabled",
		description:  "Adds enforcing or report-only Content Security Policy headers.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			if hs.Cfg.CSPEnabled || hs.Cfg.CSPReportOnlyEnabled {
				m.UseMiddleware(middleware.ContentSecurityPolicy(hs.Cfg, hs.log))
			}
		},
	},
	{
		name:         "HTTPServer.middlewares",
		registration: "Use",
		condition:    "One or more extension middlewares were added with HTTPServer.AddMiddleware",
		description:  "Appends extension middlewares after Grafana's built-in middleware.",
		apply: func(hs *HTTPServer, m *web.Mux) {
			for _, mw := range hs.middlewares {
				m.Use(mw)
			}
		},
	},
}

func (hs *HTTPServer) addMiddlewaresAndStaticRoutes() {
	for _, registration := range middlewareRegistrationTable {
		registration.apply(hs, hs.web)
	}
}
