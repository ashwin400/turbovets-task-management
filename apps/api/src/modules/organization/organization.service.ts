import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../../entities/organization.entity';
import { User } from '../../entities/user.entity';
import {
  ICreateOrganization,
  IUpdateOrganization,
  Role,
  hasHigherOrEqualRole,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findOne(id: string, user: CurrentUserData): Promise<Organization> {
    const organization = await this.organizationRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'users'],
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    // Users can only access their own organization or child orgs
    const isOwnOrg = organization.id === user.organizationId;
    const isParentOrg = organization.parentId === user.organizationId;
    const isChildOrg = organization.parent?.id === user.organizationId;

    if (!isOwnOrg && !isParentOrg && !isChildOrg) {
      throw new ForbiddenException('Access denied to this organization');
    }

    return organization;
  }

  async update(
    id: string,
    updateDto: IUpdateOrganization,
    user: CurrentUserData
  ): Promise<Organization> {
    const organization = await this.findOne(id, user);

    // Only owners can update organization
    if (!hasHigherOrEqualRole(user.role, Role.OWNER)) {
      throw new ForbiddenException('Only owners can update organization details');
    }

    Object.assign(organization, updateDto);
    return this.organizationRepository.save(organization);
  }

  async createChildOrganization(
    createDto: ICreateOrganization,
    user: CurrentUserData
  ): Promise<Organization> {
    // Only owners can create child organizations
    if (!hasHigherOrEqualRole(user.role, Role.OWNER)) {
      throw new ForbiddenException('Only owners can create child organizations');
    }

    const organization = this.organizationRepository.create({
      ...createDto,
      parentId: user.organizationId,
    });

    return this.organizationRepository.save(organization);
  }

  async getMembers(
    organizationId: string,
    user: CurrentUserData
  ): Promise<User[]> {
    await this.findOne(organizationId, user);

    return this.userRepository.find({
      where: { organizationId },
      select: ['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'createdAt'],
    });
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    newRole: Role,
    user: CurrentUserData
  ): Promise<User> {
    await this.findOne(organizationId, user);

    // Only owners can change roles
    if (!hasHigherOrEqualRole(user.role, Role.OWNER)) {
      throw new ForbiddenException('Only owners can change member roles');
    }

    const member = await this.userRepository.findOne({
      where: { id: memberId, organizationId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change own role
    if (member.id === user.id) {
      throw new ForbiddenException('Cannot change your own role');
    }

    member.role = newRole;
    return this.userRepository.save(member);
  }
}
