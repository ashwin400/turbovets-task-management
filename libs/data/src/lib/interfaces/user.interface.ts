import { Role } from '../enums/role.enum';
import { IOrganization } from './organization.interface';

export interface IUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
  organization?: IOrganization;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithoutPassword extends Omit<IUser, 'password'> {}

export interface ICreateUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  organizationId: string;
}

export interface IUpdateUser {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  isActive?: boolean;
}

export interface IUserPayload {
  sub: string; // user id
  email: string;
  role: Role;
  organizationId: string;
  iat?: number;
  exp?: number;
}
