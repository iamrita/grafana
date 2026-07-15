# HTTP middleware

<!-- This file is generated from pkg/api/middleware_registry.go. Do not edit it directly. -->

Grafana registers global HTTP middleware in the following order. The source registration table enforces this order at runtime. To change the pipeline, edit `middlewareRegistrationTable` in `pkg/api/middleware_registry.go`, then run `go test ./pkg/api -run TestMiddlewareRegistrationDocumentation -update-middleware-docs` to regenerate this document.

`UseMiddleware` registers wrapper middleware directly. `Use` is the legacy adapter for handlers and also accepts wrapper middleware. Adapted handlers can return a response without calling the rest of the pipeline.

| Order | Middleware | Registration | Condition | Purpose |
| ---: | --- | --- | --- | --- |
| 1 | `requestmeta.SetupRequestMetadata` | `Use` | Always | Initializes request metadata used by later middleware. |
| 2 | `middleware.RequestTracing` | `Use` | Always | Creates and names the trace span for the request. |
| 3 | `middleware.RequestMetrics` | `Use` | Always | Records request count, status, and duration metrics. |
| 4 | `LoggerMiddleware.Middleware` | `UseMiddleware` | Always | Adds structured request logging. |
| 5 | `middleware.Gziper` | `UseMiddleware` | server.enable_gzip is enabled | Compresses eligible HTTP responses. |
| 6 | `middleware.Recovery` | `UseMiddleware` | Always | Recovers from panics and returns an HTTP 500 response. |
| 7 | `Csrf.Middleware` | `UseMiddleware` | Always | Validates cross-site request forgery protections. |
| 8 | `HTTPServer.mapStatic` | `Use` | Standard assets are always registered; local image uploads require a local image provider | Serves static assets, robots.txt, the mock service worker, and local image uploads. |
| 9 | `middleware.AddCustomResponseHeaders` | `Use` | server.custom_response_headers contains at least one header | Adds configured response headers. |
| 10 | `middleware.AddDefaultResponseHeaders` | `Use` | Always | Adds Grafana's default response headers. |
| 11 | `middleware.SubPathRedirect` | `UseMiddleware` | server.serve_from_sub_path is enabled and app_sub_url is set | Redirects requests to Grafana's configured application sub-path. |
| 12 | `web.Renderer` | `UseMiddleware` | Always | Configures HTML template rendering. |
| 13 | `HTTPServer monitoring endpoints` | `Use` | Always | Handles health, metrics, plugin metrics, and frontend log endpoints before authentication redirects. |
| 14 | `ContextHandler.Middleware` | `UseMiddleware` | Always | Authenticates the request and adds user and organization context. |
| 15 | `middleware.OrgRedirect` | `Use` | Always | Redirects requests when the selected organization is invalid. |
| 16 | `middleware.ValidateHostHeader` | `Use` | server.enforce_domain is enabled | Redirects host headers that don't match the configured domain. |
| 17 | `middleware.ValidateActionUrl` | `UseMiddleware` | Always | Validates action URL parameters after request context is available. |
| 18 | `middleware.HandleNoCacheHeaders` | `Use` | Always | Applies no-cache response headers when the request requires them. |
| 19 | `middleware.ContentSecurityPolicy` | `UseMiddleware` | server.content_security_policy or server.content_security_policy_report_only is enabled | Adds enforcing or report-only Content Security Policy headers. |
| 20 | `HTTPServer.middlewares` | `Use` | One or more extension middlewares were added with HTTPServer.AddMiddleware | Appends extension middlewares after Grafana's built-in middleware. |
