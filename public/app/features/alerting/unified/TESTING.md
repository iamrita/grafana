# Alerting testing

## Mocking API requests

We should strive to use **MSW** for mocking API as often as possible.
It gives us the closest behaviour to the real server.

`public/app/features/alerting/unified/mockApi.ts` contains helper functions that speed up mocking API configuration with MSW.

If you don't find a helper for an endpoint you're looking for, please add it.

**Mocking using MSW forces developers to handle loading states in tests which gives us a chance to discover UI inconsistencies at very early stages**

### Common API requests

- `api/v1/eval` used by AlertingQueryRunner
  Use `mockApi.eval` Usually an empty response should do the trick

## Mocking data sources

`public/app/features/alerting/unified/testSetup/datasources.ts` file contains functions facilitating setting up mock data sources.

## Mocking permissions

By default tests should be written with RBAC enabled. This is the most common scenario for our users.
Testing with RBAC disabled should be considered as an additional option when we already have tests for enabled RBAC.

To enable or disable Role Based Access Control in tests use
`enableRBAC` or `disableRBAC` from `public/app/features/alerting/unified/mocks.ts`

To grant a permission to a user use `grantUserPermissions` from the same file.

Grant **only the actions the test needs**. Do not grant `Object.values(AccessControlAction)` — a broad grant hides permission regressions and makes tests depend on unrelated abilities.

## Common patterns

### Isolated MSW state

`setupMswServer()` resets alertmanager config, routing trees, user storage, historian, and time-interval fixtures after each test, and clears `localStorage` so a previously selected alertmanager cannot leak into the next case.

If a handler mutates in-memory fixtures, add a matching `reset*` function and call it from `setupMswServer()`.

Prefer asserting UI state after a mutation (item gone from the table) over `captureRequests()`, once the mock is stateful.

### Querying and interacting

- Prefer `*ByRole` / `findBy*` over test ids when a role exists
- Use `userEvent.setup()` (or the `user` from `render()`)
- Await loading and empty states explicitly — MSW will surface missing handlers as failed requests

### Test data

Use factories instead of hand-built objects:

- `alertingFactory` from `mocks/server/db` for ruler rules and groups
- `mockFolder`, `mockDataSource`, `mockGrafanaRulerRule` from `mocks.ts`

### Skipped tests

Do not leave `it.skip` / `describe.skip` for “migrate to MSW later”. Add a handler or move the coverage next to the hook/page that owns the behavior.

If a skip must remain (blocked product work, enterprise-only), say why and point to the replacement coverage.
