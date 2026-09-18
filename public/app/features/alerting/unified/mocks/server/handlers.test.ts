import { API_GROUP, API_VERSION } from '@grafana/api-clients/rtkq/notifications.alerting/v0alpha1';

import { setupMswServer } from '../../mockApi';
import { GRAFANA_RULES_SOURCE_NAME } from '../../utils/datasource';

import { alertingFactory } from './db';
import { getAlertmanagerConfig, setAlertmanagerConfig } from './entities/alertmanagers';
import grafanaAlertmanagerConfig from './entities/alertmanager-config/grafana-alertmanager-config';
import { NESTED_FOLDER_PARENT_UID, NESTED_FOLDER_UID } from './handlers/folders';
import { FOLDER_TITLE_HAPPY_PATH } from './handlers/search';
import { ALERTING_API_SERVER_BASE_URL } from './utils';

setupMswServer();

const k8sReceiversUrl = `${ALERTING_API_SERVER_BASE_URL}/namespaces/default/receivers`;

describe('alerting mock server', () => {
  describe('k8s receivers', () => {
    it('persists created receivers so later list/get calls see them', async () => {
      const createdName = 'mock-persisted-email';
      const createResponse = await fetch(k8sReceiversUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: `${API_GROUP}/${API_VERSION}`,
          kind: 'Receiver',
          metadata: { name: createdName },
          spec: {
            title: createdName,
            integrations: [{ type: 'email', settings: { addresses: 'ops@example.com' }, disableResolveMessage: false }],
          },
        }),
      });

      expect(createResponse.status).toBe(201);
      expect(getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME).alertmanager_config?.receivers).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: createdName })])
      );

      const getResponse = await fetch(`${k8sReceiversUrl}/${createdName}`);
      expect(getResponse.status).toBe(200);
      await expect(getResponse.json()).resolves.toEqual(
        expect.objectContaining({
          spec: expect.objectContaining({ title: createdName }),
        })
      );
    });

    it('persists receiver updates into the in-memory alertmanager config', async () => {
      const updateResponse = await fetch(`${k8sReceiversUrl}/lotsa-emails`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: `${API_GROUP}/${API_VERSION}`,
          kind: 'Receiver',
          metadata: { uid: 'lotsa-emails' },
          spec: {
            title: 'lotsa-emails',
            integrations: [
              { type: 'email', settings: { addresses: 'updated@example.com' }, disableResolveMessage: false },
            ],
          },
        }),
      });

      expect(updateResponse.status).toBe(200);
      const updated = getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME).alertmanager_config?.receivers?.find(
        (receiver) => receiver.name === 'lotsa-emails'
      );
      expect(updated?.grafana_managed_receiver_configs?.[0].settings).toEqual({ addresses: 'updated@example.com' });
    });

    it('rejects creating a receiver that already exists', async () => {
      const response = await fetch(k8sReceiversUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiVersion: `${API_GROUP}/${API_VERSION}`,
          kind: 'Receiver',
          spec: { title: 'grafana-default-email', integrations: [] },
        }),
      });

      expect(response.status).toBe(409);
    });
  });

  describe('provisioning export', () => {
    it('returns mute timings as AlertingFileExport JSON and YAML', async () => {
      const jsonResponse = await fetch('/api/v1/provisioning/mute-timings/export?format=json');
      expect(jsonResponse.status).toBe(200);
      await expect(jsonResponse.json()).resolves.toEqual({
        apiVersion: 1,
        muteTimes: [
          { orgId: 1, name: 'Some interval', time_intervals: [] },
          { orgId: 1, name: 'A provisioned interval', time_intervals: [] },
        ],
      });

      const yamlResponse = await fetch('/api/v1/provisioning/mute-timings/export?format=yaml');
      expect(yamlResponse.status).toBe(200);
      expect(await yamlResponse.text()).toContain('name: Some interval');
    });

    it('exports a single mute timing and 404s unknown names', async () => {
      const found = await fetch('/api/v1/provisioning/mute-timings/Some%20interval/export?format=json');
      expect(found.status).toBe(200);
      await expect(found.json()).resolves.toEqual({
        apiVersion: 1,
        muteTimes: [{ orgId: 1, name: 'Some interval', time_intervals: [] }],
      });

      const missing = await fetch('/api/v1/provisioning/mute-timings/does-not-exist/export?format=json');
      expect(missing.status).toBe(404);
    });
  });

  describe('folders', () => {
    it('lists root folders and children by parentUid, with pagination', async () => {
      const roots = await (await fetch('/api/folders')).json();
      expect(roots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ uid: NESTED_FOLDER_PARENT_UID, title: 'Alerting-folder' }),
          expect.objectContaining({ title: 'Folder A' }),
        ])
      );
      expect(roots).not.toEqual(expect.arrayContaining([expect.objectContaining({ uid: NESTED_FOLDER_UID })]));

      const children = await (await fetch(`/api/folders?parentUid=${NESTED_FOLDER_PARENT_UID}`)).json();
      expect(children).toEqual([
        expect.objectContaining({ uid: NESTED_FOLDER_UID, parentUid: NESTED_FOLDER_PARENT_UID }),
      ]);

      const page = await (await fetch('/api/folders?limit=1&page=1')).json();
      expect(page).toHaveLength(1);
    });
  });

  describe('search', () => {
    it('returns complete folder hits and filters by query/type', async () => {
      const all = await (await fetch('/api/search')).json();
      expect(all).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: FOLDER_TITLE_HAPPY_PATH,
            type: 'dash-folder',
            uid: expect.any(String),
            url: expect.any(String),
            tags: [],
          }),
        ])
      );

      const filtered = await (await fetch('/api/search?query=slash&type=dash-folder')).json();
      expect(filtered).toEqual([expect.objectContaining({ title: 'Folder / with slash' })]);
    });
  });

  describe('alertmanagers', () => {
    it('returns grouped alerts for healthy alertmanagers', async () => {
      const response = await fetch(`/api/alertmanager/${GRAFANA_RULES_SOURCE_NAME}/api/v2/alerts/groups`);
      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual([
        expect.objectContaining({
          receiver: { name: 'grafana-default-email' },
          alerts: expect.arrayContaining([expect.objectContaining({ fingerprint: expect.any(String) })]),
        }),
      ]);
    });

    it('validates Grafana and external alertmanager configs differently', async () => {
      const grafanaOk = await fetch(`/api/alertmanager/${GRAFANA_RULES_SOURCE_NAME}/config/api/v1/alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grafanaAlertmanagerConfig),
      });
      expect(grafanaOk.status).toBe(200);

      const externalRejected = await fetch('/api/alertmanager/vanilla-alertmanager/config/api/v1/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(grafanaAlertmanagerConfig),
      });
      expect(externalRejected.status).toBe(400);

      setAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME, grafanaAlertmanagerConfig);
    });
  });

  describe('datasources and access control', () => {
    it('returns Prometheus-shaped resource payloads', async () => {
      const labels = await (await fetch('/api/datasources/uid/prometheus/resources/api/v1/labels')).json();
      expect(labels).toEqual({ status: 'success', data: expect.arrayContaining(['__name__', 'job']) });

      const values = await (
        await fetch('/api/datasources/uid/prometheus/resources/api/v1/label/__name__/values')
      ).json();
      expect(values).toEqual({ status: 'success', data: expect.arrayContaining(['up']) });
    });

    it('describes RBAC for receivers, folders, and time intervals', async () => {
      const description = await (await fetch('/api/access-control/receivers/description')).json();
      expect(description.permissions).toEqual(['View', 'Edit', 'Admin']);

      const folders = await (await fetch('/api/access-control/folders/description')).json();
      expect(folders.assignments.users).toBe(true);

      const details = await (await fetch('/api/access-control/receivers/grafana-default-email')).json();
      expect(details[0].permission).toBe('Edit');
    });
  });

  describe('recording rule factory', () => {
    it('does not invent annotations for Grafana recording rules', () => {
      const rule = alertingFactory.ruler.grafana.recordingRule.build();
      expect(rule.annotations).toBeUndefined();
      expect(rule.grafana_alert.record).toEqual(
        expect.objectContaining({ metric: expect.stringContaining('recording_rule_') })
      );
    });
  });
});
