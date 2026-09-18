import { dump } from 'js-yaml';
import { HttpResponse, HttpResponseResolver, http } from 'msw';

import { getAlertmanagerConfig } from 'app/features/alerting/unified/mocks/server/entities/alertmanagers';
import { GRAFANA_RULES_SOURCE_NAME } from 'app/features/alerting/unified/utils/datasource';
import { MuteTimeInterval } from 'app/plugins/datasource/alertmanager/types';

interface MuteTimeIntervalExport {
  orgId: number;
  name: string;
  time_intervals: MuteTimeInterval['time_intervals'];
}

interface AlertingFileExport {
  apiVersion: number;
  muteTimes: MuteTimeIntervalExport[];
}

const collectMuteTimings = (): MuteTimeInterval[] => {
  const config = getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME);
  const { time_intervals = [], mute_time_intervals = [] } = config.alertmanager_config ?? {};
  return [...time_intervals, ...mute_time_intervals];
};

export const buildMuteTimingsExport = (name?: string): AlertingFileExport | undefined => {
  const timings = collectMuteTimings();
  const filtered = name ? timings.filter((timing) => timing.name === name) : timings;

  if (name && filtered.length === 0) {
    return undefined;
  }

  return {
    apiVersion: 1,
    muteTimes: filtered.map((timing) => ({
      orgId: 1,
      name: timing.name,
      time_intervals: timing.time_intervals ?? [],
    })),
  };
};

const toHcl = (exportPayload: AlertingFileExport) => {
  return exportPayload.muteTimes
    .map((timing, index) => {
      const resourceName = `mute_timing_${index}`;
      return [
        `resource "grafana_mute_timing" "${resourceName}" {`,
        `  name = ${JSON.stringify(timing.name)}`,
        `}`,
      ].join('\n');
    })
    .join('\n\n');
};

const getProvisioningHelper: HttpResponseResolver<{ name?: string }> = ({ request, params }) => {
  const url = new URL(request.url);
  const format = url.searchParams.get('format') ?? 'yaml';
  const exportPayload = buildMuteTimingsExport(params.name);

  if (!exportPayload) {
    return HttpResponse.json({ message: 'mute timing not found' }, { status: 404 });
  }

  if (format === 'json') {
    return HttpResponse.text(JSON.stringify(exportPayload), { headers: { 'Content-Type': 'application/json' } });
  }

  if (format === 'hcl') {
    return HttpResponse.text(toHcl(exportPayload), { headers: { 'Content-Type': 'text/hcl' } });
  }

  return HttpResponse.text(dump(exportPayload), { headers: { 'Content-Type': 'text/yaml' } });
};

const exportMuteTimingsHandler = () => http.get('/api/v1/provisioning/mute-timings/export', getProvisioningHelper);
const exportMuteTimingsHandlerTrailingSlash = () =>
  http.get('/api/v1/provisioning/mute-timings/export/', getProvisioningHelper);
const exportSpecificMuteTimingsHandler = () =>
  http.get('/api/v1/provisioning/mute-timings/:name/export', getProvisioningHelper);
const exportSpecificMuteTimingsHandlerTrailingSlash = () =>
  http.get('/api/v1/provisioning/mute-timings/:name/export/', getProvisioningHelper);

const handlers = [
  exportMuteTimingsHandler(),
  exportMuteTimingsHandlerTrailingSlash(),
  exportSpecificMuteTimingsHandler(),
  exportSpecificMuteTimingsHandlerTrailingSlash(),
];
export default handlers;
