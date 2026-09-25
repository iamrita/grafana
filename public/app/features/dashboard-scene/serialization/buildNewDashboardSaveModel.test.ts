import { DataSourceApi, PluginType, VariableSupportType } from '@grafana/data';
import { config } from '@grafana/runtime';
import { contextSrv } from 'app/core/services/context_srv';
import { AccessControlAction } from 'app/types/accessControl';

import { buildNewDashboardSaveModel, buildNewDashboardSaveModelV2 } from './buildNewDashboardSaveModel';

const fakeDsMock: DataSourceApi = {
  name: 'fake-std',
  type: 'fake-std',
  getRef: () => ({ type: 'fake-std', uid: 'fake-std' }),
  query: () =>
    Promise.resolve({
      data: [],
    }),
  testDatasource: () => Promise.resolve({ status: 'success', message: 'abc' }),
  meta: {
    id: 'fake-std',
    type: PluginType.datasource,
    module: 'fake-std',
    baseUrl: '',
    name: 'fake-std',
    info: {
      author: { name: '' },
      description: '',
      links: [],
      logos: { large: '', small: '' },
      updated: '',
      version: '',
      screenshots: [],
    },
  },
  // Standard variable support
  variables: {
    getType: () => VariableSupportType.Standard,
    toDataQuery: (q) => ({ ...q, refId: 'FakeDataSource-refId' }),
  },
  getTagKeys: jest.fn(),
  getGroupByKeys: jest.fn(),
  uid: 'fake-std',
};

jest.mock('@grafana/runtime', () => ({
  ...jest.requireActual('@grafana/runtime'),
  config: {
    featureToggles: {
      newDashboardWithFiltersAndGroupBy: false,
    },
    apps: {},
    bootData: {
      ...jest.requireActual('@grafana/runtime').config.bootData,
      user: {
        timezone: 'Africa/Abidjan',
      },
    },
  },
  getDataSourceSrv: () => ({
    get: (): Promise<DataSourceApi> => {
      return Promise.resolve(fakeDsMock);
    },
  }),
}));

describe('buildNewDashboardSaveModelV1', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks a new dashboard editable only when the user can create dashboards', async () => {
    jest
      .spyOn(contextSrv, 'hasPermission')
      .mockImplementation((action) => action === AccessControlAction.DashboardsCreate);
    const allowed = await buildNewDashboardSaveModel();
    expect(allowed.meta.canSave).toBe(true);
    expect(allowed.meta.canEdit).toBe(true);

    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);
    const denied = await buildNewDashboardSaveModel();
    expect(denied.meta.canSave).toBe(false);
    expect(denied.meta.canEdit).toBe(false);
  });

  it('should not have template variables defined by default', async () => {
    const result = await buildNewDashboardSaveModel();
    expect(result.dashboard.templating).toBeUndefined();
  });

  describe('when featureToggles.newDashboardWithFiltersAndGroupBy is true', () => {
    beforeAll(() => {
      config.featureToggles.newDashboardWithFiltersAndGroupBy = true;
    });
    afterAll(() => {
      config.featureToggles.newDashboardWithFiltersAndGroupBy = false;
    });

    it('should add filter and group by variables if the datasource supports it and is set as default', async () => {
      const result = await buildNewDashboardSaveModel();
      expect(result.dashboard.templating?.list).toHaveLength(2);
      expect(result.dashboard.templating?.list?.[0].type).toBe('adhoc');
      expect(result.dashboard.templating?.list?.[1].type).toBe('groupby');
    });

    it("should set the new dashboard's timezone to the user's timezone", async () => {
      const result = await buildNewDashboardSaveModel();
      expect(result.dashboard.timezone).toEqual('Africa/Abidjan');
    });
  });
});

describe('buildNewDashboardSaveModelV2', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks a new dashboard editable only when the user can create dashboards', async () => {
    jest
      .spyOn(contextSrv, 'hasPermission')
      .mockImplementation((action) => action === AccessControlAction.DashboardsCreate);
    const allowed = await buildNewDashboardSaveModelV2();
    expect(allowed.access.canSave).toBe(true);
    expect(allowed.access.canEdit).toBe(true);

    jest.spyOn(contextSrv, 'hasPermission').mockReturnValue(false);
    const denied = await buildNewDashboardSaveModelV2();
    expect(denied.access.canSave).toBe(false);
    expect(denied.access.canEdit).toBe(false);
  });

  it('should not have template variables defined by default', async () => {
    const result = await buildNewDashboardSaveModelV2();
    expect(result.spec.variables).toEqual([]);
  });

  describe('when featureToggles.newDashboardWithFiltersAndGroupBy is true', () => {
    beforeAll(() => {
      config.featureToggles.newDashboardWithFiltersAndGroupBy = true;
    });
    afterAll(() => {
      config.featureToggles.newDashboardWithFiltersAndGroupBy = false;
    });

    it('should add filter and group by variables if the datasource supports it and is set as default', async () => {
      const result = await buildNewDashboardSaveModelV2();
      expect(result.spec.variables).toHaveLength(2);
      expect(result.spec.variables[0].kind).toBe('AdhocVariable');
      expect(result.spec.variables[1].kind).toBe('GroupByVariable');
    });

    it("should set the new dashboard's timezone to the user's timezone", async () => {
      const result = await buildNewDashboardSaveModelV2();
      expect(result.spec.timeSettings.timezone).toEqual('Africa/Abidjan');
    });
  });
});
