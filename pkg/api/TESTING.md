# Testing `pkg/api`

## Compile time

The `pkg/api` package has a large dependency graph because `HTTPServer` wires the full HTTP surface. Compiling the test binary pulls in many services even when running a single test.

Integration tests that require a real database are isolated behind the `integration` build tag in `*_integration_test.go` files. This keeps them out of the default unit-test compile graph.

## Running tests

```bash
# Unit tests only (default; skips integration-tagged files)
go test -short ./pkg/api/...

# Include integration-tagged tests
go test -tags=integration -short ./pkg/api/...

# Run a specific integration test
go test -tags=integration -run TestIntegrationOrgUsers ./pkg/api/ -count=1
```

CI runs integration tests via `make test-go-integration`, which passes `-tags=integration`.

## Integration-tagged files

| File | Reason |
|------|--------|
| `frontendsettings_test.go` | All tests use `InitTestDB` |
| `plugin_resource_test.go` | All tests use `InitTestDB` |
| `folder_bench_test.go` | Benchmark with sqlstore + apiserver |
| `org_users_integration_test.go` | SQL-backed org user tests |
