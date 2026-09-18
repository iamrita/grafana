import { HttpResponse, http } from 'msw';

import { API_GROUP, API_VERSION, Receiver } from '@grafana/api-clients/rtkq/notifications.alerting/v0alpha1';
import {
  getAlertmanagerConfig,
  setAlertmanagerConfig,
} from 'app/features/alerting/unified/mocks/server/entities/alertmanagers';
import { ALERTING_API_SERVER_BASE_URL, getK8sResponse } from 'app/features/alerting/unified/mocks/server/utils';
import { KnownProvenance } from 'app/features/alerting/unified/types/knownProvenance';
import { GRAFANA_RULES_SOURCE_NAME } from 'app/features/alerting/unified/utils/datasource';
import { K8sAnnotations } from 'app/features/alerting/unified/utils/k8s/constants';
import { receiverConfigToK8sIntegration } from 'app/features/alerting/unified/utils/k8s/utils';
import { GrafanaManagedContactPoint, GrafanaManagedReceiverConfig } from 'app/plugins/datasource/alertmanager/types';

const usedByPolicies = ['grafana-default-email'];
const usedByRules = ['grafana-default-email'];
const cannotBeEdited = ['grafana-default-email'];
const cannotBeDeleted = ['grafana-default-email'];

const getReceiversList = () => {
  const config = getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME);

  // Turn our mock alertmanager config into the format that we expect to be returned by the k8s API
  const mappedReceivers =
    config.alertmanager_config?.receivers?.map((contactPoint) => {
      const provenance =
        contactPoint.grafana_managed_receiver_configs?.find((integration) => {
          return integration.provenance;
        })?.provenance || KnownProvenance.None;
      // Only receivers from Grafana configuration can be used (not imported ones)
      const canUse = provenance !== KnownProvenance.ConvertedPrometheus;
      return {
        apiVersion: `${API_GROUP}/${API_VERSION}`,
        kind: 'Receiver' as const,
        metadata: {
          // This isn't exactly accurate, but its the cleanest way to use the same data for AM config and K8S responses
          uid: contactPoint.name,
          annotations: {
            [K8sAnnotations.Provenance]: provenance,
            [K8sAnnotations.CanUse]: canUse ? 'true' : 'false',
            [K8sAnnotations.AccessAdmin]: 'true',
            [K8sAnnotations.AccessDelete]: cannotBeDeleted.includes(contactPoint.name) ? 'false' : 'true',
            [K8sAnnotations.AccessWrite]: cannotBeEdited.includes(contactPoint.name) ? 'false' : 'true',
            [K8sAnnotations.InUseRoutes]: usedByPolicies.includes(contactPoint.name) ? '1' : '0',
            [K8sAnnotations.InUseRules]: usedByRules.includes(contactPoint.name) ? '1' : '0',
          },
        },
        spec: {
          title: contactPoint.name,
          integrations: (contactPoint.grafana_managed_receiver_configs || []).map(receiverConfigToK8sIntegration),
        },
      };
    }) || [];

  return getK8sResponse<Receiver>('ReceiverList', mappedReceivers);
};

const findMappedReceiver = (name: string) => {
  return getReceiversList().items.find((receiver) => receiver.metadata.uid === name || receiver.metadata.name === name);
};

const k8sReceiverToContactPoint = (receiver: Receiver): GrafanaManagedContactPoint => {
  const name = receiver.spec.title;
  const integrations: GrafanaManagedReceiverConfig[] = (receiver.spec.integrations ?? []).map((integration) => ({
    uid: integration.uid,
    name,
    type: integration.type,
    disableResolveMessage: integration.disableResolveMessage ?? false,
    settings: (integration.settings as GrafanaManagedReceiverConfig['settings']) ?? {},
    secureFields: integration.secureFields ?? {},
    version: integration.version,
  }));

  return {
    name,
    id: receiver.metadata?.name ?? receiver.metadata?.uid ?? name,
    grafana_managed_receiver_configs: integrations,
  };
};

const persistReceivers = (receivers: GrafanaManagedContactPoint[]) => {
  const config = getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME);
  setAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME, {
    ...config,
    alertmanager_config: {
      ...config.alertmanager_config,
      receivers,
    },
  });
};

const getPersistedReceivers = () =>
  getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME).alertmanager_config?.receivers ?? [];

const listNamespacedReceiverHandler = () =>
  http.get<{ namespace: string }>(`${ALERTING_API_SERVER_BASE_URL}/namespaces/:namespace/receivers`, () => {
    return HttpResponse.json(getReceiversList());
  });

const getNamespacedReceiverHandler = () =>
  http.get<{ namespace: string; name: string }>(
    `${ALERTING_API_SERVER_BASE_URL}/namespaces/:namespace/receivers/:name`,
    ({ params }) => {
      const { name } = params;
      const matchedReceiver = findMappedReceiver(name);
      if (!matchedReceiver) {
        return HttpResponse.json({}, { status: 404 });
      }
      return HttpResponse.json(matchedReceiver);
    }
  );

const updateNamespacedReceiverHandler = () =>
  http.put<{ namespace: string; name: string }>(
    `${ALERTING_API_SERVER_BASE_URL}/namespaces/:namespace/receivers/:name`,
    async ({ params, request }) => {
      const { name } = params;
      const existing = getPersistedReceivers();
      const index = existing.findIndex((receiver) => receiver.name === name);
      if (index === -1) {
        return HttpResponse.json({}, { status: 404 });
      }

      const body: Receiver = await request.clone().json();
      const updatedReceivers = existing.map((receiver, receiverIndex) =>
        receiverIndex === index ? k8sReceiverToContactPoint(body) : receiver
      );
      persistReceivers(updatedReceivers);

      const persisted = findMappedReceiver(body.spec.title) ?? findMappedReceiver(name);
      return HttpResponse.json(persisted);
    }
  );

const createNamespacedReceiverHandler = () =>
  http.post<{ namespace: string }>(
    `${ALERTING_API_SERVER_BASE_URL}/namespaces/:namespace/receivers`,
    async ({ request }) => {
      const body: Receiver = await request.clone().json();
      const created = k8sReceiverToContactPoint(body);
      const existing = getPersistedReceivers();

      if (existing.some((receiver) => receiver.name === created.name)) {
        return HttpResponse.json({ message: 'receiver already exists' }, { status: 409 });
      }

      persistReceivers([...existing, created]);
      return HttpResponse.json(findMappedReceiver(created.name) ?? body, { status: 201 });
    }
  );

const deleteNamespacedReceiverHandler = () =>
  http.delete<{ namespace: string; name: string }>(
    `${ALERTING_API_SERVER_BASE_URL}/namespaces/:namespace/receivers/:name`,
    ({ params }) => {
      const { name } = params;
      const config = getAlertmanagerConfig(GRAFANA_RULES_SOURCE_NAME);
      const matchedReceiver = config.alertmanager_config?.receivers?.find((receiver) => receiver.name === name);
      if (!matchedReceiver) {
        return HttpResponse.json({}, { status: 404 });
      }

      const newConfig = config.alertmanager_config?.receivers?.filter((receiver) => receiver.name !== name);
      persistReceivers(newConfig ?? []);
      return HttpResponse.json(getReceiversList());
    }
  );

const handlers = [
  listNamespacedReceiverHandler(),
  getNamespacedReceiverHandler(),
  updateNamespacedReceiverHandler(),
  createNamespacedReceiverHandler(),
  deleteNamespacedReceiverHandler(),
];
export default handlers;
