import { HttpResponse, http } from 'msw';

import { buildInfoResponse } from 'app/features/alerting/unified/testSetup/featureDiscovery';

/** UID of the alertmanager that is expected to be broken in tests */
export const MOCK_DATASOURCE_UID_BROKEN_ALERTMANAGER = 'FwkfQfEmYlAthB';
/** Display name of the alertmanager that is expected to be broken in tests */
export const MOCK_DATASOURCE_NAME_BROKEN_ALERTMANAGER = 'broken alertmanager';
export const MOCK_DATASOURCE_EXTERNAL_VANILLA_ALERTMANAGER_UID = 'vanilla-alertmanager';
export const MOCK_DATASOURCE_PROVISIONED_MIMIR_ALERTMANAGER_UID = 'provisioned-alertmanager';
export const MOCK_DATASOURCE_GRAFANA_MIMIR = 'grafana-mimir';

const isSupportedType = (uid: string): uid is keyof typeof buildInfoResponse => {
  return uid in buildInfoResponse;
};

const PROMETHEUS_METRIC_NAMES = ['up', 'alertmanager_alerts', 'grafana_alerting_rule_evaluations_total'];
const PROMETHEUS_LABELS = ['__name__', 'job', 'instance', 'alertname'];

export const datasourceBuildInfoHandler = () =>
  http.get<{ datasourceUid: keyof typeof buildInfoResponse | string }>(
    '/api/datasources/proxy/uid/:datasourceUid/api/v1/status/buildinfo',
    ({ params }) => {
      const { datasourceUid } = params;
      if (isSupportedType(datasourceUid)) {
        const response = buildInfoResponse[datasourceUid];
        return HttpResponse.json(response);
      }
      return HttpResponse.json({ status: 'success', data: {} });
    }
  );

const labelValuesHandler = () =>
  http.get('/api/datasources/uid/:datasourceUid/resources/api/v1/label/__name__/values', () => {
    return HttpResponse.json({ status: 'success', data: PROMETHEUS_METRIC_NAMES });
  });

const resourcesLabelsHandler = () =>
  http.get('/api/datasources/uid/:datasourceUid/resources/api/v1/labels', () =>
    HttpResponse.json({ status: 'success', data: PROMETHEUS_LABELS })
  );

const resourcesMetadataHandler = () =>
  http.get('/api/datasources/uid/:datasourceUid/resources/api/v1/metadata', () =>
    HttpResponse.json({
      status: 'success',
      data: {
        up: [{ type: 'gauge', help: '1 if the instance is healthy', unit: '' }],
        alertmanager_alerts: [{ type: 'gauge', help: 'How many alerts by state', unit: '' }],
      },
    })
  );

const datasourcesHandlers = [
  datasourceBuildInfoHandler(),
  labelValuesHandler(),
  resourcesLabelsHandler(),
  resourcesMetadataHandler(),
];
export default datasourcesHandlers;
