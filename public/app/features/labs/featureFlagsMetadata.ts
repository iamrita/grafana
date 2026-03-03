export interface FeatureFlagMetadata {
  name: string;
  description: string;
  stage: 'experimental' | 'preview' | 'privatePreview' | 'GA' | 'deprecated';
  owner: string;
  frontend: boolean;
}

export const featureFlagsMetadata: FeatureFlagMetadata[] = [
  {
    "name": "aiGeneratedDashboardChanges",
    "description": "Enable AI powered features for dashboards to auto-summary changes when saving",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "alertRuleRestore",
    "description": "Enables the alert rule restore feature",
    "stage": "preview",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertRuleUseFiredAtForStartsAt",
    "description": "Use FiredAt for StartsAt when sending alerts to Alertmaanger",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingBacktesting",
    "description": "Rule backtesting API for alerting",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingCentralAlertHistory",
    "description": "Enables the new central alert history.",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingImportYAMLUI",
    "description": "Enables a UI feature for importing rules from a Prometheus file to Grafana-managed rules",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingListViewV2",
    "description": "Enables the new alert list view design",
    "stage": "privatePreview",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingListViewV2PreviewToggle",
    "description": "Enables the alerting list view v2 preview toggle",
    "stage": "privatePreview",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingMigrationUI",
    "description": "Enables the alerting migration UI, to migrate data source-managed rules to Grafana-managed rules",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingNavigationV2",
    "description": "Enables the new Alerting navigation structure with improved menu grouping",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingNotificationsStepMode",
    "description": "Enables simplified step mode in the notifications section",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingPrometheusRulesPrimary",
    "description": "Uses Prometheus rules as the primary source of truth for ruler-enabled data sources",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingQueryAndExpressionsStepMode",
    "description": "Enables step mode for alerting queries and expressions",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingQueryOptimization",
    "description": "Optimizes eligible queries in order to reduce load on datasources",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingSaveStateCompressed",
    "description": "Enables the compressed protobuf-based alert state storage. Default is enabled.",
    "stage": "preview",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingSaveStatePeriodic",
    "description": "Writes the state periodically to the database, asynchronous to rule evaluation",
    "stage": "privatePreview",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertingSavedSearches",
    "description": "Enables saved searches for alert rules list",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertingUIOptimizeReducer",
    "description": "Enables removing the reducer from the alerting UI when creating a new alert rule and using instant query",
    "stage": "GA",
    "owner": "@grafana/alerting-squad",
    "frontend": true
  },
  {
    "name": "alertmanagerRemotePrimary",
    "description": "Enable Grafana to have a remote Alertmanager instance as the primary Alertmanager.",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "alertmanagerRemoteSecondary",
    "description": "Enable Grafana to sync configuration and state with a remote Alertmanager.",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "annotationPermissionUpdate",
    "description": "Change the way annotation permissions work by scoping them to folders and dashboards.",
    "stage": "GA",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "assetSriChecks",
    "description": "Enables SRI checks for Grafana JavaScript assets",
    "stage": "experimental",
    "owner": "@grafana/frontend-ops",
    "frontend": true
  },
  {
    "name": "awsAsyncQueryCaching",
    "description": "Enable caching for async queries for Redshift and Athena. Requires that the datasource has caching and async query support enabled",
    "stage": "GA",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "awsDatasourcesHttpProxy",
    "description": "Enables http proxy settings for aws datasources",
    "stage": "experimental",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "awsDatasourcesTempCredentials",
    "description": "Support temporary security credentials in AWS plugins for Grafana Cloud customers",
    "stage": "GA",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "azureMonitorDisableLogLimit",
    "description": "Disables the log limit restriction for Azure Monitor when true. The limit is enabled by default.",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "azureMonitorEnableUserAuth",
    "description": "Enables user auth for Azure Monitor datasource only",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "azureMonitorLogsBuilderEditor",
    "description": "Enables the logs builder mode for the Azure Monitor data source",
    "stage": "preview",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "azureMonitorPrometheusExemplars",
    "description": "Allows configuration of Azure Monitor as a data source that can provide Prometheus exemplars",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "azureResourcePickerUpdates",
    "description": "Enables the updated Azure Monitor resource picker",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": true
  },
  {
    "name": "cachingOptimizeSerializationMemoryUsage",
    "description": "If enabled, the caching backend gradually serializes query responses for the cache, comparing against the configured `[caching]max_value_mb` value as it goes. This can can help prevent Grafana from running out of memory while attempting to cache very large query responses.",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "canvasPanelNesting",
    "description": "Allow elements nesting",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "canvasPanelPanZoom",
    "description": "Allow pan and zoom in canvas panel",
    "stage": "preview",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "cdnPluginsLoadFirst",
    "description": "Prioritize loading plugins from the CDN before other sources",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "cdnPluginsUrls",
    "description": "Enable loading plugins via declarative URLs",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "cloudWatchBatchQueries",
    "description": "Runs CloudWatch metrics queries as separate batches",
    "stage": "preview",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "cloudWatchCrossAccountQuerying",
    "description": "Enables cross-account querying in CloudWatch datasources",
    "stage": "GA",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "cloudWatchNewLabelParsing",
    "description": "Updates CloudWatch label parsing to be more accurate",
    "stage": "GA",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "cloudWatchRoundUpEndTime",
    "description": "Round up end time for metric queries to the next minute to avoid missing data",
    "stage": "GA",
    "owner": "@grafana/aws-datasources",
    "frontend": false
  },
  {
    "name": "crashDetection",
    "description": "Enables browser crash detection reporting to Faro.",
    "stage": "experimental",
    "owner": "@grafana/observability-traces-and-profiling",
    "frontend": true
  },
  {
    "name": "dashboardDisableSchemaValidationV1",
    "description": "Disable schema validation for dashboards/v1",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "dashboardDisableSchemaValidationV2",
    "description": "Disable schema validation for dashboards/v2",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "dashboardLevelTimeMacros",
    "description": "Supports __from and __to macros that always use the dashboard level time range",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dashboardLibrary",
    "description": "Displays datasource provisioned dashboards in dashboard empty page, only when coming from datasource configuration page",
    "stage": "experimental",
    "owner": "@grafana/sharing-squad",
    "frontend": false
  },
  {
    "name": "dashboardNewLayouts",
    "description": "Enables new dashboard layouts",
    "stage": "preview",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "dashboardScene",
    "description": "Enables dashboard rendering using scenes for all roles",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dashboardSceneForViewers",
    "description": "Enables dashboard rendering using Scenes for viewer roles",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dashboardSceneSolo",
    "description": "Enables rendering dashboards using scenes for solo panels",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dashboardSchemaValidationLogging",
    "description": "Log schema validation errors so they can be analyzed later",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "dashboardTemplates",
    "description": "Enables a flow to get started with a new dashboard from a template",
    "stage": "preview",
    "owner": "@grafana/sharing-squad",
    "frontend": false
  },
  {
    "name": "dashboardUndoRedo",
    "description": "Enables undo/redo in dynamic dashboards",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dashboardValidatorApp",
    "description": "Enables dashboard validator app to run compatibility checks between a dashboard and data source",
    "stage": "experimental",
    "owner": "@grafana/sharing-squad",
    "frontend": false
  },
  {
    "name": "dashgpt",
    "description": "Enable AI powered features in dashboards",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "dataplaneAggregator",
    "description": "Enable grafana dataplane aggregator",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "datasourceAPIServers",
    "description": "Expose some datasources as apiservers.",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "datasourceConnectionsTab",
    "description": "Shows defined connections for a data source in the plugins detail page",
    "stage": "privatePreview",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": true
  },
  {
    "name": "datasourceQueryTypes",
    "description": "Show query type endpoints in datasource API servers (currently hardcoded for testdata, expressions, and prometheus)",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "disableClassicHTTPHistogram",
    "description": "Disables classic HTTP Histogram (use with enableNativeHTTPHistogram)",
    "stage": "experimental",
    "owner": "@grafana/grafana-backend-services-squad",
    "frontend": false
  },
  {
    "name": "disableEnvelopeEncryption",
    "description": "Disable envelope encryption (emergency only)",
    "stage": "GA",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "disableNumericMetricsSortingInExpressions",
    "description": "In server-side expressions, disable the sorting of numeric-kind metrics by their metric name or labels.",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "disableSSEDataplane",
    "description": "Disables dataplane specific processing in server side expressions.",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "drilldownRecommendations",
    "description": "Enables showing recently used drilldowns or recommendations given by the datasource in the AdHocFilters and GroupBy variables",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "elasticsearchCrossClusterSearch",
    "description": "Enables cross cluster search in the Elasticsearch data source",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "elasticsearchImprovedParsing",
    "description": "Enables less memory intensive Elasticsearch result parsing",
    "stage": "experimental",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "elasticsearchRawDSLQuery",
    "description": "Enables the raw DSL query editor in the Elasticsearch data source",
    "stage": "experimental",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "enableDatagridEditing",
    "description": "Enables the edit functionality in the datagrid panel",
    "stage": "preview",
    "owner": "@grafana/dataviz-squad",
    "frontend": false
  },
  {
    "name": "enableExtensionsAdminPage",
    "description": "Enables the extension admin page regardless of development mode",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "enableNativeHTTPHistogram",
    "description": "Enables native HTTP Histograms",
    "stage": "experimental",
    "owner": "@grafana/grafana-backend-services-squad",
    "frontend": false
  },
  {
    "name": "enableSCIM",
    "description": "Enables SCIM support for user and group management",
    "stage": "preview",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "exploreLogsAggregatedMetrics",
    "description": "Used in Logs Drilldown to query by aggregated metrics",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "exploreLogsLimitedTimeRange",
    "description": "Used in Logs Drilldown to limit the time range",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "exploreLogsShardSplitting",
    "description": "Deprecated. Replace with lokiShardSplitting. Used in Logs Drilldown to split queries into multiple queries based on the number of shards",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "exploreMetricsRelatedLogs",
    "description": "Display Related Logs in Grafana Metrics Drilldown",
    "stage": "experimental",
    "owner": "@grafana/observability-metrics",
    "frontend": true
  },
  {
    "name": "externalServiceAccounts",
    "description": "Automatic service account and token setup for plugins",
    "stage": "preview",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "externalVizSuggestions",
    "description": "Enable all plugins to supply visualization suggestions (including 3rd party plugins)",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "extraThemes",
    "description": "Enables extra themes",
    "stage": "experimental",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": true
  },
  {
    "name": "faroDatasourceSelector",
    "description": "Enable the data source selector within the Frontend Apps section of the Frontend Observability",
    "stage": "preview",
    "owner": "@grafana/app-o11y",
    "frontend": true
  },
  {
    "name": "favoriteDatasources",
    "description": "Enable favorite datasources",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": true
  },
  {
    "name": "featureHighlights",
    "description": "Highlight Grafana Enterprise features",
    "stage": "GA",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "grafanaAPIServerEnsureKubectlAccess",
    "description": "Start an additional https handler and write kubectl options",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "grafanaAPIServerWithExperimentalAPIs",
    "description": "Register experimental APIs with the k8s API server, including all datasources",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "grafanaAdvisor",
    "description": "Enables Advisor app",
    "stage": "privatePreview",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "grafanaAssistantInProfilesDrilldown",
    "description": "Enables integration with Grafana Assistant in Profiles Drilldown",
    "stage": "GA",
    "owner": "@grafana/observability-traces-and-profiling",
    "frontend": true
  },
  {
    "name": "graphiteBackendMode",
    "description": "Enables the Graphite data source full backend mode",
    "stage": "privatePreview",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "grpcServer",
    "description": "Run the GRPC server",
    "stage": "preview",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "heatmapRowsAxisOptions",
    "description": "Enable Y-axis scale configuration options for pre-bucketed heatmap data (heatmap-rows)",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "improvedExternalSessionHandling",
    "description": "Enables improved support for OAuth external sessions. After enabling this feature, users might need to re-authenticate themselves.",
    "stage": "GA",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "improvedExternalSessionHandlingSAML",
    "description": "Enables improved support for SAML external sessions. Ensure the NameID format is correctly configured in Grafana for SAML Single Logout to function properly.",
    "stage": "GA",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "individualCookiePreferences",
    "description": "Support overriding cookie preferences per user",
    "stage": "experimental",
    "owner": "@grafana/grafana-backend-group",
    "frontend": false
  },
  {
    "name": "infinityRunQueriesInParallel",
    "description": "Enables running Infinity queries in parallel",
    "stage": "privatePreview",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "influxdbBackendMigration",
    "description": "Query InfluxDB InfluxQL without the proxy",
    "stage": "GA",
    "owner": "@grafana/partner-datasources",
    "frontend": true
  },
  {
    "name": "influxdbRunQueriesInParallel",
    "description": "Enables running InfluxDB Influxql queries in parallel",
    "stage": "privatePreview",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "influxqlStreamingParser",
    "description": "Enable streaming JSON parser for InfluxDB datasource InfluxQL query language",
    "stage": "experimental",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "interactiveLearning",
    "description": "Enables the interactive learning app",
    "stage": "preview",
    "owner": "@grafana/pathfinder",
    "frontend": false
  },
  {
    "name": "investigationsBackend",
    "description": "Enable the investigations backend API",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "jaegerEnableGrpcEndpoint",
    "description": "Enable querying trace data through Jaeger's gRPC endpoint (HTTP)",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "k8SFolderCounts",
    "description": "Enable folder's api server counts",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "k8SFolderMove",
    "description": "Enable folder's api server move",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "kubernetesAggregator",
    "description": "Enable grafana's embedded kube-aggregator",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesAggregatorCapTokenAuth",
    "description": "Enable CAP token based authentication in grafana's embedded kube-aggregator",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesAlertingHistorian",
    "description": "Adds support for Kubernetes alerting historian APIs",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "kubernetesAlertingRules",
    "description": "Adds support for Kubernetes alerting and recording rules",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "kubernetesAnnotations",
    "description": "Enables app platform API for annotations",
    "stage": "experimental",
    "owner": "@grafana/grafana-backend-services-squad",
    "frontend": false
  },
  {
    "name": "kubernetesCorrelations",
    "description": "Adds support for Kubernetes correlations",
    "stage": "experimental",
    "owner": "@grafana/datapro",
    "frontend": false
  },
  {
    "name": "kubernetesDashboards",
    "description": "Use the kubernetes API in the frontend for dashboards",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "kubernetesDashboardsV2",
    "description": "Use the v2 kubernetes API in the frontend for dashboards",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "kubernetesFeatureToggles",
    "description": "Use the kubernetes API for feature toggle management in the frontend",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": true
  },
  {
    "name": "kubernetesLibraryPanels",
    "description": "Routes library panel requests from /api to the /apis endpoint",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesLogsDrilldown",
    "description": "Adds support for Kubernetes logs drilldown",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": false
  },
  {
    "name": "kubernetesQueryCaching",
    "description": "Adds support for Kubernetes querycaching",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "kubernetesShortURLs",
    "description": "Enables k8s short url api and uses it under the hood when handling legacy /api",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesSnapshots",
    "description": "Routes snapshot requests from /api to the /apis endpoint",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesStars",
    "description": "Routes stars requests from /api to the /apis endpoint",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "kubernetesUnifiedStorageQuotas",
    "description": "Adds support for Kubernetes unified storage quotas",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "localeFormatPreference",
    "description": "Specifies the locale so the correct format for numbers and dates can be shown",
    "stage": "preview",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": false
  },
  {
    "name": "logRequestsInstrumentedAsUnknown",
    "description": "Logs the path for requests that are instrumented as unknown",
    "stage": "experimental",
    "owner": "@grafana/grafana-backend-group",
    "frontend": false
  },
  {
    "name": "logsContextDatasourceUi",
    "description": "Allow datasource to provide custom UI for context view",
    "stage": "GA",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "logsExploreTableDefaultVisualization",
    "description": "Sets the logs table as default visualisation in logs explore",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "logsExploreTableVisualisation",
    "description": "A table visualisation for logs in Explore",
    "stage": "GA",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "logsPanelControls",
    "description": "Enables a control component for the logs panel in Explore",
    "stage": "preview",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "lokiExperimentalStreaming",
    "description": "Support new streaming approach for loki (prototype, needs special loki build)",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "lokiLabelNamesQueryApi",
    "description": "Defaults to using the Loki `/labels` API instead of `/series`",
    "stage": "GA",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "lokiLogsDataplane",
    "description": "Changes logs responses from Loki to be compliant with the dataplane specification.",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "lokiQueryLimitsContext",
    "description": "Send X-Loki-Query-Limits-Context header to Loki on first split request",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "lokiQuerySplitting",
    "description": "Split large interval queries into subqueries with smaller time intervals",
    "stage": "GA",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "lokiRunQueriesInParallel",
    "description": "Enables running Loki queries in parallel",
    "stage": "privatePreview",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "lokiShardSplitting",
    "description": "Use stream shards to split queries into smaller subqueries",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "metricsFromProfiles",
    "description": "Enables creating metrics from profiles and storing them as recording rules",
    "stage": "experimental",
    "owner": "@grafana/observability-traces-and-profiling",
    "frontend": true
  },
  {
    "name": "mlExpressions",
    "description": "Enable support for Machine Learning in server-side expressions",
    "stage": "experimental",
    "owner": "@grafana/alerting-squad",
    "frontend": false
  },
  {
    "name": "multiPropsVariables",
    "description": "Enables support for variables whose values can have multiple properties",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "mysqlAnsiQuotes",
    "description": "Use double quotes to escape keyword in a MySQL query",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "newClickhouseConfigPageDesign",
    "description": "Enables new design for the Clickhouse data source configuration page",
    "stage": "privatePreview",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "newFiltersUI",
    "description": "Enables new combobox style UI for the Ad hoc filters variable in scenes architecture",
    "stage": "GA",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "newGauge",
    "description": "Enable new gauge visualization",
    "stage": "preview",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "newInfluxDSConfigPageDesign",
    "description": "Enables new design for the InfluxDB data source configuration page",
    "stage": "privatePreview",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "newLogContext",
    "description": "New Log Context component",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "newLogsPanel",
    "description": "Enables the new logs panel",
    "stage": "GA",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "newPanelPadding",
    "description": "Increases panel padding globally",
    "stage": "preview",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "newTimeRangeZoomShortcuts",
    "description": "Enables new keyboard shortcuts for time range zoom operations",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "newVizSuggestions",
    "description": "Enable new visualization suggestions",
    "stage": "preview",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "opentsdbBackendMigration",
    "description": "Run queries through the data source backend",
    "stage": "GA",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "otelLogsFormatting",
    "description": "Applies OTel formatting templates to displayed logs",
    "stage": "experimental",
    "owner": "@grafana/observability-logs",
    "frontend": true
  },
  {
    "name": "panelGroupBy",
    "description": "Enables a group by action per panel",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "panelTimeSettings",
    "description": "Enables a new panel time settings drawer",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "panelTitleSearch",
    "description": "Search for dashboards using panel title",
    "stage": "preview",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "pdfTables",
    "description": "Enables generating table data as PDF in reporting",
    "stage": "preview",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "perPanelFiltering",
    "description": "Enables filtering by grouping labels on the panel level through legend or tooltip",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "perPanelNonApplicableDrilldowns",
    "description": "Enables viewing non-applicable drilldowns on a panel level",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "permissionsFilterRemoveSubquery",
    "description": "Alternative permission filter implementation that does not use subqueries for fetching the dashboard folder",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "playlistsReconciler",
    "description": "Enables experimental reconciler for playlists",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "pluginContainers",
    "description": "Enables running plugins in containers",
    "stage": "privatePreview",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "pluginInsights",
    "description": "Show insights for plugins in the plugin details page",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": true
  },
  {
    "name": "pluginInstallAPISync",
    "description": "Enable syncing plugin installations to the installs API",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "pluginProxyPreserveTrailingSlash",
    "description": "Preserve plugin proxy trailing slash.",
    "stage": "GA",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "pluginStoreServiceLoading",
    "description": "Load plugins on store service startup instead of wire provider, and call RegisterFixedRoles after all plugins are loaded",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "pluginsAutoUpdate",
    "description": "Enables auto-updating of users installed plugins",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "pluginsSriChecks",
    "description": "Enables SRI checks for plugin assets",
    "stage": "GA",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": false
  },
  {
    "name": "preferLibraryPanelTitle",
    "description": "Prefer library panel title over viz panel title.",
    "stage": "privatePreview",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "preventPanelChromeOverflow",
    "description": "Restrict PanelChrome contents with overflow: hidden;",
    "stage": "preview",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": true
  },
  {
    "name": "profilesExemplars",
    "description": "Enables profiles exemplars support in profiles drilldown",
    "stage": "experimental",
    "owner": "@grafana/observability-traces-and-profiling",
    "frontend": false
  },
  {
    "name": "prometheusAzureOverrideAudience",
    "description": "Deprecated. Allow override default AAD audience for Azure Prometheus endpoint. Enabled by default. This feature should no longer be used and will be removed in the future.",
    "stage": "deprecated",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "prometheusSpecialCharsInLabelValues",
    "description": "Adds support for quotes and special characters in label values for Prometheus queries",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": true
  },
  {
    "name": "prometheusTypeMigration",
    "description": "Checks for deprecated Prometheus authentication methods (SigV4 and Azure), installs the relevant data source, and migrates the Prometheus data sources",
    "stage": "experimental",
    "owner": "@grafana/partner-datasources",
    "frontend": false
  },
  {
    "name": "provisioning",
    "description": "Next generation provisioning... and git",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "publicDashboardsScene",
    "description": "Enables public dashboard rendering using scenes",
    "stage": "GA",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": true
  },
  {
    "name": "queryCacheRequestDeduplication",
    "description": "Enable request deduplication when query caching is enabled. Requests issuing the same query will be deduplicated, only the first request to arrive will be executed and the response will be shared with requests arriving while there is a request in-flight",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "queryLibrary",
    "description": "Enables Saved queries (query library) feature",
    "stage": "preview",
    "owner": "@grafana/sharing-squad",
    "frontend": false
  },
  {
    "name": "queryService",
    "description": "Register /apis/query.grafana.app/ -- will eventually replace /api/ds/query",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "queryServiceFromExplore",
    "description": "Routes explore requests to the new query service",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": true
  },
  {
    "name": "queryServiceFromUI",
    "description": "Routes requests to the new query service",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": true
  },
  {
    "name": "queryServiceRewrite",
    "description": "Rewrite requests targeting /ds/query to the query service",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "queryServiceWithConnections",
    "description": "Adds datasource connections to the query service",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "queryWithAssistant",
    "description": "Enables the Query with Assistant button in the query editor",
    "stage": "experimental",
    "owner": "@grafana/oss-big-tent",
    "frontend": true
  },
  {
    "name": "recentlyViewedDashboards",
    "description": "Enables recently viewed dashboards section in the browsing dashboard page",
    "stage": "experimental",
    "owner": "@grafana/grafana-search-navigate-organise",
    "frontend": true
  },
  {
    "name": "refactorVariablesTimeRange",
    "description": "Refactor time range variables flow to reduce number of API calls made when query variables are chained",
    "stage": "preview",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "renderAuthJWT",
    "description": "Uses JWT-based auth for rendering instead of relying on remote cache",
    "stage": "preview",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "reportingCsvEncodingOptions",
    "description": "Enables CSV encoding options in the reporting feature",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "reportingRetries",
    "description": "Enables rendering retries for the reporting feature",
    "stage": "preview",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "restoreDashboards",
    "description": "Enables restore deleted dashboards feature",
    "stage": "experimental",
    "owner": "@grafana/grafana-search-navigate-organise",
    "frontend": false
  },
  {
    "name": "rolePickerDrawer",
    "description": "Enables the new role picker drawer design",
    "stage": "experimental",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "rudderstackUpgrade",
    "description": "Enables the new version of rudderstack",
    "stage": "experimental",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": true
  },
  {
    "name": "scanRowInvalidDashboardParseFallbackEnabled",
    "description": "Enable fallback parsing behavior when scan row encounters invalid dashboard JSON",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "scopeApi",
    "description": "In-development feature flag for the scope api using the app platform.",
    "stage": "experimental",
    "owner": "@grafana/grafana-app-platform-squad",
    "frontend": false
  },
  {
    "name": "secretsManagementAppPlatform",
    "description": "Enable the secrets management API and services under app platform",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "secretsManagementAppPlatformUI",
    "description": "Enable the secrets management app platform UI",
    "stage": "experimental",
    "owner": "@grafana/grafana-operator-experience-squad",
    "frontend": false
  },
  {
    "name": "sharingDashboardImage",
    "description": "Enables image sharing functionality for dashboards",
    "stage": "GA",
    "owner": "@grafana/sharing-squad",
    "frontend": true
  },
  {
    "name": "showDashboardValidationWarnings",
    "description": "Show warnings when dashboards do not validate against the schema",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": false
  },
  {
    "name": "smoothingTransformation",
    "description": "Enables the ASAP smoothing transformation for time series data",
    "stage": "experimental",
    "owner": "@grafana/datapro",
    "frontend": true
  },
  {
    "name": "sqlExpressions",
    "description": "Enables SQL Expressions, which can execute SQL queries against data source results.",
    "stage": "preview",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "sqlExpressionsColumnAutoComplete",
    "description": "Enables column autocomplete for SQL Expressions",
    "stage": "experimental",
    "owner": "@grafana/datapro",
    "frontend": true
  },
  {
    "name": "sseGroupByDatasource",
    "description": "Send query to the same datasource in a single request when using server side expressions. The `cloudWatchBatchQueries` feature toggle should be enabled if this used with CloudWatch.",
    "stage": "experimental",
    "owner": "@grafana/grafana-datasources-core-services",
    "frontend": false
  },
  {
    "name": "ssoSettingsLDAP",
    "description": "Use the new SSO Settings API to configure LDAP",
    "stage": "GA",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "storage",
    "description": "Configurable storage for dashboards, datasources, and resources",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "suggestedDashboards",
    "description": "Displays datasource provisioned and community dashboards in dashboard empty page, only when coming from datasource configuration page",
    "stage": "experimental",
    "owner": "@grafana/sharing-squad",
    "frontend": false
  },
  {
    "name": "tableSharedCrosshair",
    "description": "Enables shared crosshair in table panel",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "tabularNumbers",
    "description": "Use fixed-width numbers globally in the UI",
    "stage": "GA",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": false
  },
  {
    "name": "teamFolders",
    "description": "Enables team folders functionality",
    "stage": "experimental",
    "owner": "@grafana/grafana-search-navigate-organise",
    "frontend": false
  },
  {
    "name": "teamHttpHeadersTempo",
    "description": "Enables LBAC for datasources for Tempo to apply LBAC filtering of traces to the client requests for users in teams",
    "stage": "experimental",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  },
  {
    "name": "tempoAlerting",
    "description": "Enables creating alerts from Tempo data source",
    "stage": "experimental",
    "owner": "@grafana/observability-traces-and-profiling",
    "frontend": false
  },
  {
    "name": "tempoSearchBackendMigration",
    "description": "Run search queries through the tempo backend",
    "stage": "GA",
    "owner": "@grafana/oss-big-tent",
    "frontend": false
  },
  {
    "name": "timeComparison",
    "description": "Enables time comparison option in supported panels",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "timeRangePan",
    "description": "Enables time range panning functionality",
    "stage": "experimental",
    "owner": "@grafana/dataviz-squad",
    "frontend": true
  },
  {
    "name": "timeRangeProvider",
    "description": "Enables time pickers sync",
    "stage": "experimental",
    "owner": "@grafana/grafana-frontend-platform",
    "frontend": false
  },
  {
    "name": "transformationsEmptyPlaceholder",
    "description": "Show transformation quick-start cards in empty transformations state",
    "stage": "preview",
    "owner": "@grafana/datapro",
    "frontend": true
  },
  {
    "name": "ttlPluginInstanceManager",
    "description": "Enable TTL plugin instance manager",
    "stage": "experimental",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": true
  },
  {
    "name": "unifiedHistory",
    "description": "Displays the navigation history so the user can navigate back to previous pages",
    "stage": "experimental",
    "owner": "@grafana/grafana-search-navigate-organise",
    "frontend": true
  },
  {
    "name": "unifiedNavbars",
    "description": "Enables unified navbars",
    "stage": "GA",
    "owner": "@grafana/plugins-platform-backend",
    "frontend": true
  },
  {
    "name": "unifiedRequestLog",
    "description": "Writes error logs to the request logger",
    "stage": "GA",
    "owner": "@grafana/grafana-backend-group",
    "frontend": false
  },
  {
    "name": "unifiedStorageBigObjectsSupport",
    "description": "Enables to save big objects in blob storage",
    "stage": "experimental",
    "owner": "@grafana/search-and-storage",
    "frontend": false
  },
  {
    "name": "unlimitedLayoutsNesting",
    "description": "Enables unlimited dashboard panel grouping",
    "stage": "experimental",
    "owner": "@grafana/dashboards-squad",
    "frontend": true
  },
  {
    "name": "useKubernetesShortURLsAPI",
    "description": "Routes short url requests from /api to the /apis endpoint in the frontend. Depends on kubernetesShortURLs",
    "stage": "experimental",
    "owner": "@grafana/sharing-squad",
    "frontend": true
  },
  {
    "name": "useSessionStorageForRedirection",
    "description": "Use session storage for handling the redirection after login",
    "stage": "GA",
    "owner": "@grafana/identity-access-team",
    "frontend": false
  }
];
