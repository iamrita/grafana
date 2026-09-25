import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { mockFolderDTO } from './fixtures/folder.fixture';
import { getFolderPermissions } from './permissions';

describe('getFolderPermissions', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('does not allow creating a dashboard when the user only has folders:create', () => {
    jest
      .spyOn(contextSrv, 'hasPermission')
      .mockImplementation((action) => action === AccessControlAction.FoldersCreate);
    jest.spyOn(contextSrv, 'hasPermissionInMetadata').mockImplementation((action) => {
      return action === AccessControlAction.FoldersCreate || action === AccessControlAction.DashboardsCreate;
    });

    const folder = mockFolderDTO(1, {
      accessControl: {
        [AccessControlAction.FoldersCreate]: true,
        // Folder metadata can still list dashboards:create for a Folders Creator.
        [AccessControlAction.DashboardsCreate]: true,
      },
    });

    const permissions = getFolderPermissions(folder);

    expect(permissions.canCreateFolders).toBe(true);
    expect(permissions.canCreateDashboards).toBe(false);
  });

  it('allows creating a dashboard when the user has dashboards:create on the folder', () => {
    jest
      .spyOn(contextSrv, 'hasPermission')
      .mockImplementation((action) => action === AccessControlAction.DashboardsCreate);
    jest
      .spyOn(contextSrv, 'hasPermissionInMetadata')
      .mockImplementation((action) => action === AccessControlAction.DashboardsCreate);

    const folder = mockFolderDTO(1, {
      accessControl: {
        [AccessControlAction.DashboardsCreate]: true,
      },
    });

    expect(getFolderPermissions(folder).canCreateDashboards).toBe(true);
  });

  it('does not allow creating a dashboard on the root list without dashboards:create', () => {
    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);

    expect(getFolderPermissions().canCreateDashboards).toBe(false);
  });
});
