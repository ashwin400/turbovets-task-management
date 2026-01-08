import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockExecutionContext = (user: { role: Role } | null, requiredRoles: Role[] | undefined) => {
    const mockContext = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;

    reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(requiredRoles),
    } as unknown as Reflector;

    guard = new RolesGuard(reflector);

    return mockContext;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, undefined);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when roles array is empty', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, []);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when user is not present', () => {
      const context = mockExecutionContext(null, [Role.VIEWER]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when user has exact required role', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Role.ADMIN]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when owner accesses admin-required resource', () => {
      const context = mockExecutionContext({ role: Role.OWNER }, [Role.ADMIN]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when owner accesses viewer-required resource', () => {
      const context = mockExecutionContext({ role: Role.OWNER }, [Role.VIEWER]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return true when admin accesses viewer-required resource', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Role.VIEWER]);
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should return false when viewer tries to access admin-required resource', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Role.ADMIN]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when viewer tries to access owner-required resource', () => {
      const context = mockExecutionContext({ role: Role.VIEWER }, [Role.OWNER]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return false when admin tries to access owner-required resource', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Role.OWNER]);
      expect(guard.canActivate(context)).toBe(false);
    });

    it('should return true when user role matches any of multiple required roles', () => {
      const context = mockExecutionContext({ role: Role.ADMIN }, [Role.OWNER, Role.ADMIN]);
      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
