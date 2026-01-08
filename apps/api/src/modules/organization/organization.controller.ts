import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { RolesGuard, Roles } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/auth';
import { Role, IUpdateOrganization, ICreateOrganization } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Controller('organizations')
@UseGuards(RolesGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.organizationService.findOne(id, user);
  }

  @Put(':id')
  @Roles(Role.OWNER)
  async update(
    @Param('id') id: string,
    @Body() updateDto: IUpdateOrganization,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.organizationService.update(id, updateDto, user);
  }

  @Post('child')
  @Roles(Role.OWNER)
  async createChild(
    @Body() createDto: ICreateOrganization,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.organizationService.createChildOrganization(createDto, user);
  }

  @Get(':id/members')
  async getMembers(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.organizationService.getMembers(id, user);
  }

  @Put(':id/members/:memberId/role')
  @Roles(Role.OWNER)
  async updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: Role },
    @CurrentUser() user: CurrentUserData
  ) {
    return this.organizationService.updateMemberRole(
      id,
      memberId,
      body.role,
      user
    );
  }
}
