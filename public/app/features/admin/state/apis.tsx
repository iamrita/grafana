import { createMonitoringLogger, getBackendSrv } from '@grafana/runtime';

const logger = createMonitoringLogger('admin.state.apis');

interface AnonServerStat {
  activeDevices?: number;
}

export interface ServerStat extends AnonServerStat {
  activeAdmins: number;
  activeEditors: number;
  activeSessions: number;
  activeUsers: number;
  activeViewers: number;
  admins: number;
  alerts: number;
  dashboards: number;
  datasources: number;
  editors: number;
  orgs: number;
  playlists: number;
  snapshots: number;
  stars: number;
  tags: number;
  users: number;
  viewers: number;
}

export const getServerStats = async (): Promise<ServerStat | null> => {
  return getBackendSrv()
    .get('api/admin/stats')
    .catch((err) => {
      logger.logError(err instanceof Error ? err : new Error('Failed to get server stats'), { context: 'getServerStats' });
      return null;
    });
};
