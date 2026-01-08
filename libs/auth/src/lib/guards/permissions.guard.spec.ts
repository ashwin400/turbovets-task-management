import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { Permission, Role } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  const mockExecutionContext = (
    user: { role: Role } | null,
    requiredPermissions: Permission[] | undefined
  ) => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredPermissions),
    } as unknown as Reflector;

    guard = new PermissionsGuard(reflector);

    return mockContext;
  };

  describe('canActivate', () => {
    it('should return true when no permissions are required', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, undefined);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when permissions array is empty', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, []);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user is not present', () => {
      const context = mockExecutionContext(null, [Permission.TASK_READ]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when owner has task create permission', () => {
      const context = mockExecutionContext({ role: Role.OWNER }, [Permission.TASK_CREATE]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when owner has audit read permission', () => {
      const context = mockExecutionContext({ role: Role.OWNER }, [Permission.AUDIT_READ]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when admin has task create permission', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Permission.TASK_CREATE]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when admin has audit read permission', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Permission.AUDIT_READ]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when viewer has task read permission', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Permission.TASK_READ]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when viewer tries to create task', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Permission.TASK_CREATE]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when viewer tries to delete task', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Permission.TASK_DELETE]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when viewer tries to read audit logs', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Permission.AUDIT_READ]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when user has all required permissions', () => {
      const context = mockExecutionContext(
        { role: Role.ADMIN },
        [Permission.TASK_CREATE, Permission.TASK_READ, Permission.TASK_UPDATE]
      );
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user is missing any required permission', () => {
      const context = mockExecutionContext(
        { role: Role.VIEWER },
        [Permission.TASK_READ, Permission.TASK_CREATE] // Viewer can read but not create
      );
      expect(guard.canActivate(context)).toBe(false);
    });
  });
});
