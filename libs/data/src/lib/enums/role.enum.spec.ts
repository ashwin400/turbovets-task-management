import { Role, RoleHierarchy, hasHigherOrEqualRole } from './role.enum';

describe('Role Enum and Hierarchy', () => {
  describe('RoleHierarchy', () => {
    it('should have owner at highest level (3)', () => {
      expect(RoleHierarchy[Role.OWNER]).toBe(3);
    });

    it('should have admin at middle level (2)', () => {
      expect(RoleHierarchy[Role.ADMIN]).toBe(2);
    });

    it('should have viewer at lowest level (1)', () => {
      expect(RoleHierarchy[Role.VIEWER]).toBe(1);
    });
  });

  describe('hasHigherOrEqualRole', () => {
    // Owner tests
    it('should return true when owner checks against owner', () => {
      expect(hasHigherOrEqualRole(Role.OWNER, Role.OWNER)).toBe(true);
    });

    it('should return true when owner checks against admin', () => {
      expect(hasHigherOrEqualRole(Role.OWNER, Role.ADMIN)).toBe(true);
    });

    it('should return true when owner checks against viewer', () => {
      expect(hasHigherOrEqualRole(Role.OWNER, Role.VIEWER)).toBe(true);
    });

    // Admin tests
    it('should return false when admin checks against owner', () => {
      expect(hasHigherOrEqualRole(Role.ADMIN, Role.OWNER)).toBe(false);
    });

    it('should return true when admin checks against admin', () => {
      expect(hasHigherOrEqualRole(Role.ADMIN, Role.ADMIN)).toBe(true);
    });

    it('should return true when admin checks against viewer', () => {
      expect(hasHigherOrEqualRole(Role.ADMIN, Role.VIEWER)).toBe(true);
    });

    // Viewer tests
    it('should return false when viewer checks against owner', () => {
      expect(hasHigherOrEqualRole(Role.VIEWER, Role.OWNER)).toBe(false);
    });

    it('should return false when viewer checks against admin', () => {
      expect(hasHigherOrEqualRole(Role.VIEWER, Role.ADMIN)).toBe(false);
    });

    it('should return true when viewer checks against viewer', () => {
      expect(hasHigherOrEqualRole(Role.VIEWER, Role.VIEWER)).toBe(true);
    });
  });
});
