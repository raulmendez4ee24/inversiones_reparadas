import type { OrgRole, SystemRole } from '@prisma/client';

export type Permission =
  | '*'
  | 'dashboard:view'
  | 'automation:view'
  | 'automation:edit'
  | 'automation:run'
  | 'tasks:view'
  | 'tasks:create'
  | 'tasks:edit'
  | 'tasks:run'
  | 'integrations:view'
  | 'integrations:connect'
  | 'integrations:edit'
  | 'security:view'
  | 'security:manage_users'
  | 'approvals:view'
  | 'approvals:approve'
  | 'admin:clients'
  | 'admin:metrics'
  | 'admin:logs'
  | 'admin:impersonate';

export function permissionsForRoles(systemRole: SystemRole, orgRole: OrgRole | null): Permission[] {
  if (systemRole === 'SUPER_ADMIN') return ['*'];

  if (orgRole === 'ORG_ADMIN') {
    return [
      'dashboard:view',
      'automation:view',
      'automation:edit',
      'automation:run',
      'tasks:view',
      'tasks:create',
      'tasks:edit',
      'tasks:run',
      'integrations:view',
      'integrations:connect',
      'integrations:edit',
      'security:view',
      'security:manage_users',
      'approvals:view',
      'approvals:approve',
    ];
  }

  return [
    'dashboard:view',
    'automation:view',
    'tasks:view',
    'tasks:run',
    'integrations:view',
    'approvals:view',
  ];
}

export function hasPermission(userPermissions: readonly Permission[], permission: Permission): boolean {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(permission);
}

