package api

import (
	"flag"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

const middlewareDocumentationPath = "../../contribute/backend/http-middleware.md"

var updateMiddlewareDocumentation = flag.Bool(
	"update-middleware-docs",
	false,
	"update the generated HTTP middleware documentation",
)

func TestMiddlewareRegistrationTable(t *testing.T) {
	seen := make(map[string]struct{}, len(middlewareRegistrationTable))

	for _, registration := range middlewareRegistrationTable {
		assert.NotEmpty(t, registration.name)
		assert.NotEmpty(t, registration.condition, registration.name)
		assert.NotEmpty(t, registration.description, registration.name)
		assert.NotNil(t, registration.apply, registration.name)
		assert.Contains(t, []string{"Use", "UseMiddleware"}, registration.registration, registration.name)

		if _, exists := seen[registration.name]; exists {
			t.Errorf("middleware registration name %q is duplicated", registration.name)
		}
		seen[registration.name] = struct{}{}
	}
}

func TestMiddlewareRegistrationOrder(t *testing.T) {
	expected := []string{
		"requestmeta.SetupRequestMetadata",
		"middleware.RequestTracing",
		"middleware.RequestMetrics",
		"LoggerMiddleware.Middleware",
		"middleware.Gziper",
		"middleware.Recovery",
		"Csrf.Middleware",
		"HTTPServer.mapStatic",
		"middleware.AddCustomResponseHeaders",
		"middleware.AddDefaultResponseHeaders",
		"middleware.SubPathRedirect",
		"web.Renderer",
		"HTTPServer monitoring endpoints",
		"ContextHandler.Middleware",
		"middleware.OrgRedirect",
		"middleware.ValidateHostHeader",
		"middleware.ValidateActionUrl",
		"middleware.HandleNoCacheHeaders",
		"middleware.ContentSecurityPolicy",
		"HTTPServer.middlewares",
	}

	actual := make([]string, 0, len(middlewareRegistrationTable))
	for _, registration := range middlewareRegistrationTable {
		actual = append(actual, registration.name)
	}

	assert.Equal(t, expected, actual)
}

func TestConditionalMiddlewareRegistrations(t *testing.T) {
	t.Run("gzip follows the server configuration", func(t *testing.T) {
		registration := findMiddlewareRegistration(t, "middleware.Gziper")

		for _, tc := range []struct {
			name          string
			enabled       bool
			wantEncoding  string
			wantVaryValue string
		}{
			{
				name:    "disabled",
				enabled: false,
			},
			{
				name:          "enabled",
				enabled:       true,
				wantEncoding:  "gzip",
				wantVaryValue: "Accept-Encoding",
			},
		} {
			t.Run(tc.name, func(t *testing.T) {
				cfg := setting.NewCfg()
				cfg.EnableGzip = tc.enabled
				mux := web.New()
				registration.apply(&HTTPServer{Cfg: cfg}, mux)
				mux.Get("/", func(rw http.ResponseWriter, _ *http.Request) {
					_, err := rw.Write([]byte("response"))
					require.NoError(t, err)
				})

				request := httptest.NewRequest(http.MethodGet, "/", nil)
				request.Header.Set("Accept-Encoding", "gzip")
				response := httptest.NewRecorder()
				mux.ServeHTTP(response, request)

				assert.Equal(t, tc.wantEncoding, response.Header().Get("Content-Encoding"))
				assert.Equal(t, tc.wantVaryValue, response.Header().Get("Vary"))
			})
		}
	})

	t.Run("custom response headers require configuration", func(t *testing.T) {
		registration := findMiddlewareRegistration(t, "middleware.AddCustomResponseHeaders")

		for _, tc := range []struct {
			name       string
			headers    map[string]string
			wantHeader string
		}{
			{
				name: "not configured",
			},
			{
				name:       "configured",
				headers:    map[string]string{"X-Grafana-Test": "registered"},
				wantHeader: "registered",
			},
		} {
			t.Run(tc.name, func(t *testing.T) {
				cfg := setting.NewCfg()
				cfg.CustomResponseHeaders = tc.headers
				mux := web.New()
				registration.apply(&HTTPServer{Cfg: cfg}, mux)
				mux.Get("/", func(rw http.ResponseWriter, _ *http.Request) {
					rw.WriteHeader(http.StatusNoContent)
				})

				response := httptest.NewRecorder()
				mux.ServeHTTP(response, httptest.NewRequest(http.MethodGet, "/", nil))

				assert.Equal(t, tc.wantHeader, response.Header().Get("X-Grafana-Test"))
			})
		}
	})
}

func TestExtensionMiddlewaresKeepInsertionOrder(t *testing.T) {
	registration := findMiddlewareRegistration(t, "HTTPServer.middlewares")
	var calls []string
	server := &HTTPServer{
		middlewares: []web.Handler{
			func(_ *web.Context) {
				calls = append(calls, "first")
			},
			func(_ *web.Context) {
				calls = append(calls, "second")
			},
		},
	}
	mux := web.New()
	registration.apply(server, mux)
	mux.Get("/", func(rw http.ResponseWriter, _ *http.Request) {
		calls = append(calls, "route")
		rw.WriteHeader(http.StatusNoContent)
	})

	mux.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))

	assert.Equal(t, []string{"first", "second", "route"}, calls)
}

func TestMiddlewareRegistrationDocumentation(t *testing.T) {
	expected := generateMiddlewareDocumentation()
	if *updateMiddlewareDocumentation {
		require.NoError(t, os.WriteFile(middlewareDocumentationPath, []byte(expected), 0o644))
		return
	}

	actual, err := os.ReadFile(middlewareDocumentationPath)
	require.NoError(t, err)

	assert.Equal(t, expected, string(actual),
		"middleware documentation is out of date; run go test ./pkg/api -run TestMiddlewareRegistrationDocumentation -update-middleware-docs")
}

func generateMiddlewareDocumentation() string {
	var doc strings.Builder
	doc.WriteString(`# HTTP middleware

<!-- This file is generated from pkg/api/middleware_registry.go. Do not edit it directly. -->

Grafana registers global HTTP middleware in the following order. The source registration table enforces this order at runtime. To change the pipeline, edit ` + "`middlewareRegistrationTable`" + ` in ` + "`pkg/api/middleware_registry.go`" + `, then run ` + "`go test ./pkg/api -run TestMiddlewareRegistrationDocumentation -update-middleware-docs`" + ` to regenerate this document.

` + "`UseMiddleware`" + ` registers wrapper middleware directly. ` + "`Use`" + ` is the legacy adapter for handlers and also accepts wrapper middleware. Adapted handlers can return a response without calling the rest of the pipeline.

| Order | Middleware | Registration | Condition | Purpose |
| ---: | --- | --- | --- | --- |
`)

	for i, registration := range middlewareRegistrationTable {
		_, _ = fmt.Fprintf(
			&doc,
			"| %d | `%s` | `%s` | %s | %s |\n",
			i+1,
			registration.name,
			registration.registration,
			registration.condition,
			registration.description,
		)
	}

	return doc.String()
}

func findMiddlewareRegistration(t *testing.T, name string) middlewareRegistration {
	t.Helper()

	for _, registration := range middlewareRegistrationTable {
		if registration.name == name {
			return registration
		}
	}

	t.Fatalf("middleware registration %q was not found", name)
	return middlewareRegistration{}
}
