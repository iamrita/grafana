import { createMonitoringLogger, getBackendSrv } from '@grafana/runtime';
import { Team } from 'app/types/teams';
import { UserDTO, UserOrg, UserSession } from 'app/types/user';

import { ChangePasswordFields, ProfileUpdateFields } from './types';

const logger = createMonitoringLogger('profile.api');

async function changePassword(payload: ChangePasswordFields): Promise<void> {
  try {
    await getBackendSrv().put('/api/user/password', payload);
  } catch (err) {
    logger.logError(err instanceof Error ? err : new Error(String(err)), { context: 'changing password' });
  }
}

function loadUser(): Promise<UserDTO> {
  return getBackendSrv().get('/api/user');
}

function loadTeams(): Promise<Team[]> {
  return getBackendSrv().get('/api/user/teams');
}

function loadOrgs(): Promise<UserOrg[]> {
  return getBackendSrv().get('/api/user/orgs');
}

function loadSessions(): Promise<UserSession[]> {
  return getBackendSrv().get('/api/user/auth-tokens');
}

async function revokeUserSession(tokenId: number): Promise<void> {
  await getBackendSrv().post('/api/user/revoke-auth-token', {
    authTokenId: tokenId,
  });
}

async function setUserOrg(org: UserOrg): Promise<void> {
  await getBackendSrv().post('/api/user/using/' + org.orgId, {});
}

async function updateUserProfile(payload: ProfileUpdateFields): Promise<void> {
  try {
    await getBackendSrv().put('/api/user', payload);
  } catch (err) {
    logger.logError(err instanceof Error ? err : new Error(String(err)), { context: 'updating user profile' });
  }
}

export const api = {
  changePassword,
  revokeUserSession,
  loadUser,
  loadSessions,
  loadOrgs,
  loadTeams,
  setUserOrg,
  updateUserProfile,
};
