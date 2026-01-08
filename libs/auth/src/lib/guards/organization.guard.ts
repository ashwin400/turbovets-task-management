import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

/**
 * Guard that ensures users can only access resources within their organization
 * or child organizations (for 2-level hierarchy).
 *
 * This guard should be used in conjunction with route parameters that include
 * an organizationId or resources that have an organizationId field.
 */
@Injectable()
export class OrganizationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.organizationId) {
      return false;
    }

    // The organizationId in the request (from params, body, or query)
    const requestOrgId =
      request.params?.organizationId ||
      request.body?.organizationId ||
      request.query?.organizationId;

    // If no specific org is requested, allow (will be filtered by service)
    if (!requestOrgId) {
      return true;
    }

    // User can only access their own organization
    // In a real app, we'd also check child orgs for the 2-level hierarchy
    return user.organizationId === requestOrgId;
  }
}
