---
name: cloud-agent-post-change-lint
description: Enforces post-change lint verification for cloud agent runs. Use whenever a cloud agent edits code, applies patches, or completes implementation work, especially when the user asks to launch a cloud agent. Make sure this runs before any changes are pushed to Github or before a draft PR is made. 
---

# Cloud Agent Post-Change Lint

Run a lint check after code changes are made during cloud-agent tasks.

## Mandatory Workflow

1. Track every file changed in the current task.
2. After finishing edits, call `ReadLints` scoped to changed files or changed directories.
3. Fix lint or type diagnostics introduced by the current changes.
4. Re-run `ReadLints` on the same scope until clean, or until only clearly pre-existing issues remain.
5. Report lint status in the final response.

## Scope Rules

- Prefer file-level scope for small changes.
- Use directory scope when many files changed in one area.
- Do not run lint checks only on unrelated files.

## Result Reporting

Always include a short lint result line in the final response:

- `Lint: pass`
- `Lint: pass (pre-existing issues remain)`
- `Lint: blocked (<reason>)`

## Grafana-Specific Notes

- Default to `ReadLints` first for fast verification.
- If deeper verification is needed, run targeted lint/typecheck commands relevant to the changed language or package.
