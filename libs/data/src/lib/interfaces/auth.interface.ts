import { IUserWithoutPassword } from './user.interface';

export interface ILoginRequest {
  email: string;
  password: string;
}

export interface ILoginResponse {
  accessToken: string;
  user: IUserWithoutPassword;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  organizationName?: string; // For creating new organization
}

export interface ITokenPayload {
  sub: string;
  email: string;
  role: string;
  organizationId: string;
  iat: number;
  exp: number;
}
