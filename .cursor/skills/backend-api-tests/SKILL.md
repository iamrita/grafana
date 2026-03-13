---
name: backend-api-tests
description: Generate Go unit tests for backend API endpoints using Grafana's testing patterns. Use when writing tests for HTTP handlers, API endpoints, or when the user mentions "test", "unit test", "api test", or "handler test" for Go backend code.
---

# Backend API Unit Tests

Generate unit tests for Grafana backend API endpoints using established testing patterns.

## Quick Start

1. Identify the handler/endpoint to test
2. Determine which fake services are needed
3. Use `SetupAPITestServer` or `loggedInUserScenario` pattern
4. Write assertions with testify

## Test File Structure

Create test files adjacent to the code being tested with `_test.go` suffix:

```go
package api

import (
    "net/http"
    "testing"

    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/require"
    
    "github.com/grafana/grafana/pkg/web/webtest"
)

func TestYourHandler(t *testing.T) {
    // Test implementation
}
```

## Core Patterns

### Pattern 1: SetupAPITestServer (Preferred)

Use for testing HTTP handlers with full routing:

```go
func TestGetDashboard(t *testing.T) {
    server := SetupAPITestServer(t, func(hs *HTTPServer) {
        hs.DashboardService = &dashboards.FakeDashboardService{
            GetDashboardFunc: func(ctx context.Context, query *dashboards.GetDashboardQuery) (*dashboards.Dashboard, error) {
                return &dashboards.Dashboard{UID: "test-uid", Title: "Test"}, nil
            },
        }
    })

    req := server.NewGetRequest("/api/dashboards/uid/test-uid")
    webtest.RequestWithSignedInUser(req, &user.SignedInUser{
        UserID: 1,
        OrgID:  1,
    })

    resp, err := server.Send(req)
    require.NoError(t, err)
    assert.Equal(t, http.StatusOK, resp.StatusCode)
}
```

### Pattern 2: loggedInUserScenario

Use for handler tests with authentication context:

```go
func TestUpdateUser(t *testing.T) {
    loggedInUserScenario(t, "When user updates profile", "PATCH", "/api/user", "/api/user", func(sc *scenarioContext) {
        sc.userService = usertest.NewUserServiceFake()
        
        sc.fakeReqWithParams("PATCH", sc.url, map[string]string{}).exec()
        
        assert.Equal(t, http.StatusOK, sc.resp.Code)
    }, mock.AnythingOfType("*authn.Identity"))
}
```

### Pattern 3: Table-Driven Tests

Use for testing multiple scenarios:

```go
func TestValidateInput(t *testing.T) {
    tests := []struct {
        name       string
        input      string
        wantStatus int
        wantErr    bool
    }{
        {"valid input", "good", http.StatusOK, false},
        {"empty input", "", http.StatusBadRequest, true},
        {"too long", strings.Repeat("x", 1000), http.StatusBadRequest, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            // Test each case
        })
    }
}
```

## Common Fake Services

Import fakes from test packages:

| Service | Fake | Import |
|---------|------|--------|
| User | `usertest.NewUserServiceFake()` | `github.com/grafana/grafana/pkg/services/user/usertest` |
| Auth | `authntest.FakeService{}` | `github.com/grafana/grafana/pkg/services/authn/authntest` |
| Dashboard | `dashboards.FakeDashboardService{}` | `github.com/grafana/grafana/pkg/services/dashboards` |
| Folder | `foldertest.FakeFolderService{}` | `github.com/grafana/grafana/pkg/services/folder/foldertest` |
| Quota | `quotatest.New(false, nil)` | `github.com/grafana/grafana/pkg/services/quota/quotatest` |
| DB | `dbtest.NewFakeDB()` | `github.com/grafana/grafana/pkg/infra/db/dbtest` |
| Plugins | `pluginstore.FakePluginStore{}` | `github.com/grafana/grafana/pkg/plugins/pluginstore` |
| Preferences | `preftest.NewPreferenceServiceFake()` | `github.com/grafana/grafana/pkg/services/pref/preftest` |

## HTTP Test Helpers

From `pkg/web/webtest`:

```go
// Create requests
req := server.NewGetRequest("/api/endpoint")
req := server.NewPostRequest("/api/endpoint", bytes.NewReader(body))

// Add signed-in user context
webtest.RequestWithSignedInUser(req, &user.SignedInUser{
    UserID:  1,
    OrgID:   1,
    OrgRole: org.RoleAdmin,
})

// Send and check response
resp, err := server.Send(req)
require.NoError(t, err)

// Read response body
body := resp.Body
defer body.Close()
```

## Assertions

Use testify for assertions:

```go
// Fatal on failure (stops test)
require.NoError(t, err)
require.NotNil(t, result)

// Non-fatal (continues test)
assert.Equal(t, expected, actual)
assert.Contains(t, str, substring)
assert.True(t, condition)
assert.Len(t, slice, expectedLen)
```

## Testing Permissions

Test authorization with different user roles:

```go
func TestAdminEndpoint(t *testing.T) {
    tests := []struct {
        name     string
        role     org.RoleType
        wantCode int
    }{
        {"admin allowed", org.RoleAdmin, http.StatusOK},
        {"editor denied", org.RoleEditor, http.StatusForbidden},
        {"viewer denied", org.RoleViewer, http.StatusForbidden},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            server := SetupAPITestServer(t, func(hs *HTTPServer) {
                // Configure fakes
            })

            req := server.NewGetRequest("/api/admin/endpoint")
            webtest.RequestWithSignedInUser(req, &user.SignedInUser{
                OrgRole: tt.role,
            })

            resp, _ := server.Send(req)
            assert.Equal(t, tt.wantCode, resp.StatusCode)
        })
    }
}
```

## Integration Tests

For tests requiring real services, use the integration test pattern:

```go
func TestIntegrationFeature(t *testing.T) {
    testutil.SkipIntegrationTestInShortMode(t)
    
    // Integration test code
}
```

Run integration tests: `go test -v ./...`
Skip integration tests: `go test -short ./...`

## Checklist

Before submitting tests:

- [ ] Test file named `*_test.go` in same package
- [ ] Uses `t.Run()` for subtests
- [ ] Fake services configured with expected behavior
- [ ] Both success and error cases covered
- [ ] Permissions tested if endpoint is protected
- [ ] Uses `require` for fatal errors, `assert` for checks
- [ ] No hardcoded sleep; use proper synchronization
- [ ] Cleanup with `t.Cleanup()` if needed

## Reference Files

For more examples, see:
- `pkg/api/common_test.go` - Test utilities and scenarios
- `pkg/api/dashboard_test.go` - Dashboard API tests
- `pkg/api/datasources_test.go` - Datasource API tests
- `pkg/web/webtest/webtest.go` - HTTP test helpers
