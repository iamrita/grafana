package api

import (
	"flag"
	"fmt"
	"os"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

Middleware registered with ` + "`UseMiddleware`" + ` runs as a conventional before-and-after wrapper. Middleware registered with ` + "`Use`" + ` runs as a handler in the request pipeline and can return early.

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
