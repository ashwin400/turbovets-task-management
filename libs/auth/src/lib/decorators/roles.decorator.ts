import { SetMetadata } from '@nestjs/common';
import { Role } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
