import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Organization } from '../../entities/organization.entity';
import {
  ILoginRequest,
  ILoginResponse,
  IRegisterRequest,
  IUserPayload,
  Role,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['organization'],
    });

    if (user && (await user.validatePassword(password))) {
      return user;
    }

    return null;
  }

  async login(loginRequest: ILoginRequest): Promise<ILoginResponse> {
    const user = await this.validateUser(
      loginRequest.email,
      loginRequest.password
    );

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: IUserPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: user.toJSON() as any,
    };
  }

  async register(registerRequest: IRegisterRequest): Promise<ILoginResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerRequest.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    let organization: Organization;

    if (registerRequest.organizationId) {
      // Join existing organization
      const existingOrg = await this.organizationRepository.findOne({
        where: { id: registerRequest.organizationId },
      });
      if (!existingOrg) {
        throw new UnauthorizedException('Organization not found');
      }
      organization = existingOrg;
    } else if (registerRequest.organizationName) {
      // Create new organization
      organization = this.organizationRepository.create({
        name: registerRequest.organizationName,
      });
      await this.organizationRepository.save(organization);
    } else {
      throw new UnauthorizedException(
        'Organization ID or name must be provided'
      );
    }

    // Create user - first user in org becomes owner
    const orgUserCount = await this.userRepository.count({
      where: { organizationId: organization.id },
    });

    const user = this.userRepository.create({
      email: registerRequest.email,
      password: registerRequest.password,
      firstName: registerRequest.firstName,
      lastName: registerRequest.lastName,
      role: orgUserCount === 0 ? Role.OWNER : Role.VIEWER,
      organizationId: organization.id,
    });

    await this.userRepository.save(user);

    // Login the newly registered user
    return this.login({
      email: registerRequest.email,
      password: registerRequest.password,
    });
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['organization'],
    });
  }
}
