export type Role = 'owner' | 'admin' | 'member' | 'readonly';

export type Permission =
  | 'contacts:read'
  | 'contacts:write'
  | 'contacts:delete'
  | 'deals:read'
  | 'deals:write'
  | 'deals:delete'
  | 'org:manage'
  | 'audit:read';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    'contacts:read',
    'contacts:write',
    'contacts:delete',
    'deals:read',
    'deals:write',
    'deals:delete',
    'org:manage',
    'audit:read',
  ],
  admin: [
    'contacts:read',
    'contacts:write',
    'contacts:delete',
    'deals:read',
    'deals:write',
    'deals:delete',
    'audit:read',
  ],
  member: [
    'contacts:read',
    'contacts:write',
    'deals:read',
    'deals:write',
  ],
  readonly: [
    'contacts:read',
    'deals:read',
  ],
};

export const hasPermission = (userRole: Role, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

export interface TenantContext {
  userId: string;
  organizationId: string;
  role: Role;
  email: string;
}

export class AuthorizationError extends Error {
  constructor(message = 'Acesso não autorizado pelo protocolo RBAC') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export const assertPermission = (context: TenantContext, permission: Permission) => {
  if (!hasPermission(context.role, permission)) {
    throw new AuthorizationError(
      `O utilizador com papel '${context.role}' não tem permissão para '${permission}'.`
    );
  }
};
