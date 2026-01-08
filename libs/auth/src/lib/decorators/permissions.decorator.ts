import { SetMetadata } from '@nestjs/common';
import { Permission } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
