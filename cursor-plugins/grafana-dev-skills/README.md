# grafana-dev-skills

A Cursor plugin that packages the team's shared skills for working on the Grafana codebase. Installing it makes the skills available in every workspace, not just this repository.

## Skills

| Skill                          | Use when                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend-api-tests`            | Writing Go unit tests for HTTP handlers and API endpoints (`SetupAPITestServer`, `loggedInUserScenario`, fake services, permission tables) |
| `browser-testing`              | Verifying React component changes in the browser: screenshots, clicking CTAs, filling forms, responsive breakpoints                        |
| `cloud-agent-post-change-lint` | Any cloud agent run that edits code; enforces a `ReadLints` pass before pushing or opening a PR                                            |
| `jira-ticket-format`           | Creating Jira tickets; standard Context / Scope / Acceptance Criteria / Notes / Security / Risks layout                                    |
| `onboard`                      | Onboarding a new developer to a codebase: setup discovery, architecture overview, suggested Plan mode prompts                              |

## Installation

### Team marketplace (recommended)

The repository root contains `.cursor-plugin/marketplace.json`, so the repo can be imported as a team marketplace.

1. A team admin opens **Dashboard → Plugins & MCPs → Team Marketplaces → Add Marketplace → Import from Repo** and enters this repository's URL.
2. Set the plugin to **Default On** so it installs automatically for everyone, or leave it **Default Off** for opt-in.
3. Members find it under **Customize** in the Cursor sidebar and install it (if not already auto-installed).

Turn on **Enable Auto Refresh** in the marketplace settings so merges to `main` propagate without a manual refresh.

### Local install

```bash
git clone https://github.com/iamrita/grafana.git /tmp/grafana-plugin-src
cp -r /tmp/grafana-plugin-src/cursor-plugins/grafana-dev-skills ~/.cursor/plugins/local/grafana-dev-skills
```

Reload Cursor. Symlinks into `~/.cursor/plugins/local` are not loaded, so copy the directory rather than linking it.

### Cursor Agent CLI

```bash
agent --plugin-dir /path/to/grafana/cursor-plugins/grafana-dev-skills
```

## Maintenance

- Skill sources live in `skills/<name>/SKILL.md`. The `name` in each file's frontmatter must match its directory name.
- Bump `version` in `.cursor-plugin/plugin.json` whenever a skill changes so installed copies pick up the update.
- To add a skill, create `skills/<new-skill>/SKILL.md` with `name` and `description` frontmatter and add a row to the table above.
