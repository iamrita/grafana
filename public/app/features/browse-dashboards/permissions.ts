import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';
import { FolderDTO } from 'app/types/folders';

import { BrowseDashboardsPermissions } from './types';

function checkFolderPermission(action: AccessControlAction, folderDTO?: FolderDTO) {
  return folderDTO ? contextSrv.hasPermissionInMetadata(action, folderDTO) : contextSrv.hasPermission(action);
}

function checkCanCreateFolders(folderDTO?: FolderDTO) {
  return checkFolderPermission(AccessControlAction.FoldersCreate, folderDTO);
}

export function getFolderPermissions(folderDTO?: FolderDTO) {
  // /dashboard/new is allowed only for dashboards:create. Folder metadata can still
  // report that action for a Folders Creator (folders:create only), and
  // hasEditPermissionInFolders is true for either action. Require the user action
  // so the New dashboard item matches the route.
  const canCreateDashboards =
    contextSrv.hasPermission(AccessControlAction.DashboardsCreate) &&
    checkFolderPermission(AccessControlAction.DashboardsCreate, folderDTO);
  const canCreateFolders = checkCanCreateFolders(folderDTO);
  const canDeleteFolders = checkFolderPermission(AccessControlAction.FoldersDelete, folderDTO);
  const canDeleteDashboards = checkFolderPermission(AccessControlAction.DashboardsDelete, folderDTO);
  const canEditDashboards = checkFolderPermission(AccessControlAction.DashboardsWrite, folderDTO);
  const canEditFolders = checkFolderPermission(AccessControlAction.FoldersWrite, folderDTO);
  const canSetPermissions = checkFolderPermission(AccessControlAction.FoldersPermissionsWrite, folderDTO);
  const canViewPermissions = checkFolderPermission(AccessControlAction.FoldersPermissionsRead, folderDTO);

  return {
    canCreateDashboards,
    canCreateFolders,
    canDeleteFolders,
    canEditDashboards,
    canEditFolders,
    canSetPermissions,
    canViewPermissions,
    canDeleteDashboards,
  };
}

export function canEditItemType(itemKind: string, permissions: BrowseDashboardsPermissions) {
  const { canEditFolders, canDeleteFolders, canEditDashboards, canDeleteDashboards } = permissions;
  return itemKind === 'folder'
    ? Boolean(canEditFolders || canDeleteFolders)
    : Boolean(canEditDashboards || canDeleteDashboards);
}

export function canSelectItems(permissions: BrowseDashboardsPermissions) {
  const { canEditFolders, canDeleteFolders, canEditDashboards, canDeleteDashboards } = permissions;
  // Users can select items only if they have both edit and delete permissions for at least one item type
  const canSelectFolders = canEditFolders || canDeleteFolders;
  const canSelectDashboards = canEditDashboards || canDeleteDashboards;
  return Boolean(canSelectFolders || canSelectDashboards);
}
