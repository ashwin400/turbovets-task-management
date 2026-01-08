import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

export interface CurrentUserData {
  id: string;
  email: string;
  role: Role;
  organizationId: string;
  firstName: string;
  lastName: string;
}

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserData | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as CurrentUserData;

    if (data) {
      return user?.[data];
    }

    return user;
  }
);
