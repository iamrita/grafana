import { HttpResponse, http } from 'msw';

import { mockFolder } from 'app/features/alerting/unified/mocks';
import { grafanaRulerRule } from 'app/features/alerting/unified/mocks/grafanaRulerApi';
import { FolderDTO } from 'app/types/folders';

export const NESTED_FOLDER_PARENT_UID = 'e3d1f4fd-9e7c-4f63-9a9e-2b5a1d2e6a9c';
export const NESTED_FOLDER_UID = 'nested-alerting-folder';

export const DEFAULT_FOLDERS: FolderDTO[] = [
  mockFolder({
    id: 1,
    uid: NESTED_FOLDER_PARENT_UID,
    title: 'Alerting-folder',
  }),
  mockFolder({
    id: 2,
    uid: grafanaRulerRule.grafana_alert.namespace_uid,
    title: 'Folder A',
  }),
  mockFolder({
    id: 3,
    uid: 'NAMESPACE_UID',
    title: 'Some Folder',
  }),
  mockFolder({
    id: 4,
    uid: NESTED_FOLDER_UID,
    title: 'Nested alerting folder',
    parentUid: NESTED_FOLDER_PARENT_UID,
  }),
];

const DEFAULT_FOLDER_LIST_LIMIT = 1000;

const folderMatchesPermission = (folder: FolderDTO, permission: string | null) => {
  if (!permission) {
    return true;
  }

  if (permission.toLowerCase() === 'edit') {
    return folder.canEdit;
  }

  return true;
};

export const getFolderHandler = (responseOverride?: FolderDTO) =>
  http.get<{ folderUid: string }>(`/api/folders/:folderUid`, ({ request, params }) => {
    const matchingFolder = DEFAULT_FOLDERS.find((folder) => folder.uid === params.folderUid);
    const response = responseOverride || matchingFolder;

    if (!response) {
      return HttpResponse.json({ message: 'folder not found', status: 'not-found' }, { status: 404 });
    }

    const { accessControl, ...withoutAccessControl } = response;

    // Server only responds with ACL if query param is sent
    const accessControlQueryParam = new URL(request.url).searchParams.get('accesscontrol');
    if (!accessControlQueryParam) {
      return HttpResponse.json(withoutAccessControl);
    }

    return HttpResponse.json(response);
  });

export const listFoldersHandler = (folders = DEFAULT_FOLDERS) =>
  http.get(`/api/folders`, ({ request }) => {
    const url = new URL(request.url);
    const parentUid = url.searchParams.get('parentUid');
    const permission = url.searchParams.get('permission');
    const limitParam = url.searchParams.get('limit');
    const pageParam = url.searchParams.get('page');

    const filtered = folders.filter((folder) => {
      const isChildOfRequestedParent = parentUid ? folder.parentUid === parentUid : !folder.parentUid;
      return isChildOfRequestedParent && folderMatchesPermission(folder, permission);
    });

    const limit = limitParam ? Number(limitParam) : DEFAULT_FOLDER_LIST_LIMIT;
    const page = pageParam ? Math.max(Number(pageParam), 1) : 1;
    const start = (page - 1) * limit;
    const pageItems = Number.isFinite(limit) && limit > 0 ? filtered.slice(start, start + limit) : filtered;

    const strippedFolders = pageItems.map(({ id, uid, title, parentUid: folderParentUid }) => {
      return { id, uid, title, ...(folderParentUid ? { parentUid: folderParentUid } : {}) };
    });

    return HttpResponse.json(strippedFolders);
  });

/** @deprecated Move to or use inbuilt handlers from `@grafana/test-utils` instead */
const handlers = [listFoldersHandler(), getFolderHandler()];

export default handlers;
