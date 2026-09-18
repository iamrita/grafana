![Grafana Logo (Light)](docs/logo-horizontal.png#gh-light-mode-only)
![Grafana Logo (Dark)](docs/logo-horizontal-dark.png#gh-dark-mode-only)

The open-source platform for monitoring and observability

[![License](https://img.shields.io/github/license/grafana/grafana)](LICENSE)

Grafana lets you query, visualize, alert on, and understand your metrics, logs, traces, and profiles no matter where they are stored. Create, explore, and share dashboards with your team and foster a data-driven culture:

- **Visualizations:** Fast, flexible client-side graphs with many panel plugins for metrics, logs, traces, and profiles.
- **Dynamic dashboards:** Reusable dashboards with template variables that appear as dropdowns at the top of the dashboard.
- **Explore:** Run ad-hoc queries and drill down across metrics, logs, traces, and profiles. Split the view to compare time ranges, queries, and data sources side by side.
- **Alerting:** Define alert rules visually. Grafana evaluates them continuously and sends notifications to systems like Slack, PagerDuty, and Opsgenie.
- **Mixed data sources:** Mix data sources in the same panel. You can set a data source per query, including custom plugins.

## Get started

- [Get Grafana](https://grafana.com/get)
- [Installation guides](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)

Unsure if Grafana is for you? Watch Grafana in action on [play.grafana.org](https://play.grafana.org/).

## Develop locally

Grafana is a Go backend and a TypeScript/React frontend. Embedded SQLite is the default database, so you don't need an external database to start.

### Prerequisites

- [Git](https://git-scm.com/)
- [Go](https://go.dev/dl/) (see [go.mod](go.mod) for the required version)
- [Node.js 24.x](https://nodejs.org/) with [corepack](https://nodejs.org/api/corepack.html) enabled (see [.nvmrc](.nvmrc))
- [Yarn 4](https://yarnpkg.com/) via corepack (see `packageManager` in [package.json](package.json))
- [GCC](https://gcc.gnu.org/) for CGo/SQLite compilation of the backend

Enable Yarn, then install frontend dependencies:

```sh
corepack enable
corepack install
yarn install --immutable
```

### Run frontend and backend

In two terminals, from the repository root:

```sh
# Frontend (webpack watch; first compile takes about 45s)
yarn start

# Backend with hot reload (first build can take a few minutes)
make run
```

Open [http://localhost:3000](http://localhost:3000). Default login is `admin` / `admin`. The backend proxies frontend assets from the webpack dev server.

No external databases are required. To add backing services later, run `make devenv sources=postgres,influxdb,loki`.

### Test, lint, and typecheck

```sh
# Frontend (yarn test is watch-mode by default)
yarn jest --no-watch path/to/file.test.tsx
yarn lint
yarn typecheck

# Backend
go test -run TestName ./pkg/services/myservice/
```

For the full setup, plugin watch commands, and troubleshooting, see the [developer guide](contribute/developer-guide.md). Frontend contributors should also read the [frontend style guide](contribute/style-guides/frontend.md).

## Documentation

The Grafana documentation is available at [grafana.com/docs](https://grafana.com/docs/).

## Contributing

If you're interested in contributing to the Grafana project:

- Start by reading the [contributing guide](CONTRIBUTING.md).
- Set up your environment with the [developer guide](contribute/developer-guide.md).
- Explore [beginner-friendly issues](https://github.com/grafana/grafana/issues?q=is%3Aopen+is%3Aissue+label%3A%22beginner+friendly%22).
- Look through the [style guide and Storybook](https://developers.grafana.com/ui/latest/index.html).

> Share your contributor experience in our [feedback survey](https://gra.fan/ome) to help us improve.

## Get involved

- Follow [@grafana on X](https://x.com/grafana/).
- Read and subscribe to the [Grafana blog](https://grafana.com/blog/).
- If you have a specific question, check out our [discussion forums](https://community.grafana.com/).
- For general discussions, join us on the [official Slack](https://slack.grafana.com) team.

This project is tested with [BrowserStack](https://www.browserstack.com/).

## License

Grafana is distributed under [AGPL-3.0-only](LICENSE). For Apache-2.0 exceptions, see [LICENSING.md](LICENSING.md).
