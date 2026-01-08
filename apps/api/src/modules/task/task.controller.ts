import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';
import { RolesGuard, PermissionsGuard, RequirePermissions } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/auth';
import {
  Permission,
  TaskStatus,
  TaskCategory,
  TaskPriority,
  ICreateTask,
  IUpdateTask,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Controller('tasks')
@UseGuards(RolesGuard, PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @RequirePermissions(Permission.TASK_CREATE)
  async create(
    @Body() createTaskDto: ICreateTask,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.taskService.create(createTaskDto, user);
  }

  @Get()
  @RequirePermissions(Permission.TASK_READ)
  async findAll(
    @CurrentUser() user: CurrentUserData,
    @Query('status') status?: TaskStatus,
    @Query('category') category?: TaskCategory,
    @Query('priority') priority?: TaskPriority,
    @Query('assigneeId') assigneeId?: string,
    @Query('search') search?: string
  ) {
    return this.taskService.findAll(user, {
      status,
      category,
      priority,
      assigneeId,
      search,
    });
  }

  @Get(':id')
  @RequirePermissions(Permission.TASK_READ)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.taskService.findOne(id, user);
  }

  @Put(':id')
  @RequirePermissions(Permission.TASK_UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateTaskDto: IUpdateTask,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.taskService.update(id, updateTaskDto, user);
  }

  @Delete(':id')
  @RequirePermissions(Permission.TASK_DELETE)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData
  ) {
    return this.taskService.remove(id, user);
  }

  @Put(':id/reorder')
  @RequirePermissions(Permission.TASK_UPDATE)
  async reorder(
    @Param('id') id: string,
    @Body() body: { order: number; status?: TaskStatus },
    @CurrentUser() user: CurrentUserData
  ) {
    return this.taskService.reorder(id, body.order, body.status, user);
  }
}
