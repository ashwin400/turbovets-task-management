export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ACCESS_DENIED = 'access_denied',
}

export interface IAuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string; // e.g., 'task', 'user', 'organization'
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
  createdAt: Date;
}

export interface ICreateAuditLog {
  userId: string;
  userEmail: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  organizationId: string;
}

export interface IAuditLogFilters {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
}
