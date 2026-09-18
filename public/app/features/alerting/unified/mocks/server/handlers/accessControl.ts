import { HttpResponse, http } from 'msw';

import { Description, ResourcePermission } from 'app/core/components/AccessControl/types';
import { AccessControlAction } from 'app/types/accessControl';

const sharedAssignments = {
  users: true,
  serviceAccounts: true,
  teams: true,
  builtInRoles: true,
};

const resourceDescriptionsMap: Record<string, Description> = {
  receivers: {
    assignments: sharedAssignments,
    permissions: ['View', 'Edit', 'Admin'],
  },
  folders: {
    assignments: sharedAssignments,
    permissions: ['View', 'Edit', 'Admin'],
  },
  timeintervals: {
    assignments: sharedAssignments,
    permissions: ['View', 'Edit'],
  },
};

const viewerReceiverPermission: ResourcePermission = {
  id: 123,
  roleName: 'somerole:name',
  isManaged: true,
  isInherited: false,
  isServiceAccount: false,
  builtInRole: 'Viewer',
  actions: [AccessControlAction.AlertingReceiversRead, AccessControlAction.AlertingNotificationsRead],
  permission: 'View',
};

const editorReceiverPermission: ResourcePermission = {
  ...viewerReceiverPermission,
  id: 124,
  builtInRole: 'Editor',
  actions: [
    AccessControlAction.AlertingReceiversRead,
    AccessControlAction.AlertingReceiversWrite,
    AccessControlAction.AlertingNotificationsRead,
    AccessControlAction.AlertingNotificationsWrite,
  ],
  permission: 'Edit',
};

/**
 * Map of pre-determined resources and corresponding IDs for those resources,
 * to permissions for those resources
 * */
const resourceDetailsMap: Record<string, Record<string, ResourcePermission[]>> = {
  receivers: {
    'lotsa-emails': [viewerReceiverPermission],
    'grafana-default-email': [editorReceiverPermission],
    'provisioned-contact-point': [viewerReceiverPermission],
  },
  folders: {
    'e3d1f4fd-9e7c-4f63-9a9e-2b5a1d2e6a9c': [
      {
        id: 200,
        roleName: 'folder:alerting',
        isManaged: true,
        isInherited: false,
        isServiceAccount: false,
        builtInRole: 'Editor',
        actions: [AccessControlAction.FoldersRead, AccessControlAction.AlertingRuleRead],
        permission: 'Edit',
      },
    ],
  },
  timeintervals: {
    'Some interval': [viewerReceiverPermission],
  },
};

const getAccessControlResourceDescriptionHandler = () =>
  http.get<{ resourceType: string }>(`/api/access-control/:resourceType/description`, ({ params }) => {
    const matchedResourceDescription = resourceDescriptionsMap[params.resourceType];
    return matchedResourceDescription
      ? HttpResponse.json(matchedResourceDescription)
      : HttpResponse.json({ message: 'Not found' }, { status: 404 });
  });

const getAccessControlResourceDetailsHandler = () =>
  http.get<{ resourceType: string; resourceId: string }>(
    `/api/access-control/:resourceType/:resourceId`,
    ({ params }) => {
      const matchedResourceDetails = resourceDetailsMap[params.resourceType]?.[params.resourceId];
      return matchedResourceDetails
        ? HttpResponse.json(matchedResourceDetails)
        : HttpResponse.json(
            {
              message: 'Failed to get permissions',
              traceID: '',
            },
            { status: 404 }
          );
    }
  );

const handlers = [getAccessControlResourceDescriptionHandler(), getAccessControlResourceDetailsHandler()];

export default handlers;
