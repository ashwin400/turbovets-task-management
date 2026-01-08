import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like, In } from 'typeorm';
import { Task } from '../../entities/task.entity';
import { Organization } from '../../entities/organization.entity';
import {
  ICreateTask,
  IUpdateTask,
  ITaskFilters,
  TaskStatus,
  Role,
  hasHigherOrEqualRole,
  AuditAction,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';
import { AuditService } from '../audit/audit.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
    private readonly auditService: AuditService
  ) {}

  private async getAccessibleOrgIds(user: CurrentUserData): Promise<string[]> {
    // Get user's organization and any child organizations
    const org = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['children'],
    });

    if (!org) {
      return [user.organizationId];
    }

    const orgIds = [org.id];

    // If user is owner/admin, include child organizations
    if (hasHigherOrEqualRole(user.role, Role.ADMIN) && org.children) {
      orgIds.push(...org.children.map((child) => child.id));
    }

    return orgIds;
  }

  async create(
    createTaskDto: ICreateTask,
    user: CurrentUserData
  ): Promise<Task> {
    // Get max order for the user's organization
    const maxOrderResult = await this.taskRepository
      .createQueryBuilder('task')
      .select('MAX(task.order)', 'maxOrder')
      .where('task.organizationId = :orgId', { orgId: user.organizationId })
      .getRawOne();

    const task = this.taskRepository.create({
      ...createTaskDto,
      status: createTaskDto.status || TaskStatus.TODO,
      order: (maxOrderResult?.maxOrder || 0) + 1,
      createdById: user.id,
      organizationId: user.organizationId,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    });

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.logTaskAction(
      user.id,
      user.email,
      user.organizationId,
      AuditAction.CREATE,
      savedTask.id,
      { title: savedTask.title }
    );

    return savedTask;
  }

  async findAll(
    user: CurrentUserData,
    filters?: ITaskFilters
  ): Promise<Task[]> {
    const orgIds = await this.getAccessibleOrgIds(user);

    const where: FindOptionsWhere<Task> = {
      organizationId: In(orgIds),
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.assigneeId) {
      where.assigneeId = filters.assigneeId;
    }

    let queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .where(where);

    if (filters?.search) {
      queryBuilder = queryBuilder.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    return queryBuilder.orderBy('task.order', 'ASC').getMany();
  }

  async findOne(id: string, user: CurrentUserData): Promise<Task> {
    const orgIds = await this.getAccessibleOrgIds(user);

    const task = await this.taskRepository.findOne({
      where: { id, organizationId: In(orgIds) },
      relations: ['createdBy', 'assignee'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: IUpdateTask,
    user: CurrentUserData
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    // Check permissions - viewers can't update
    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot update tasks');
    }

    // Admins can only update tasks in their organization
    if (user.role === Role.ADMIN && task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot update tasks in other organizations');
    }

    const updatedTask = this.taskRepository.merge(task, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate
        ? new Date(updateTaskDto.dueDate)
        : task.dueDate,
    });

    const savedTask = await this.taskRepository.save(updatedTask);

    await this.auditService.logTaskAction(
      user.id,
      user.email,
      user.organizationId,
      AuditAction.UPDATE,
      savedTask.id,
      { changes: updateTaskDto }
    );

    return savedTask;
  }

  async remove(id: string, user: CurrentUserData): Promise<void> {
    const task = await this.findOne(id, user);

    // Check permissions - only owner and admin can delete
    if (!hasHigherOrEqualRole(user.role, Role.ADMIN)) {
      throw new ForbiddenException('Only owners and admins can delete tasks');
    }

    // Admins can only delete tasks in their organization
    if (user.role === Role.ADMIN && task.organizationId !== user.organizationId) {
      throw new ForbiddenException('Cannot delete tasks in other organizations');
    }

    await this.taskRepository.remove(task);

    await this.auditService.logTaskAction(
      user.id,
      user.email,
      user.organizationId,
      AuditAction.DELETE,
      id,
      { title: task.title }
    );
  }

  async reorder(
    id: string,
    newOrder: number,
    newStatus: TaskStatus | undefined,
    user: CurrentUserData
  ): Promise<Task> {
    const task = await this.findOne(id, user);

    if (user.role === Role.VIEWER) {
      throw new ForbiddenException('Viewers cannot reorder tasks');
    }

    const oldOrder = task.order;
    const oldStatus = task.status;

    // Update order for affected tasks
    if (newOrder > oldOrder) {
      await this.taskRepository
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" - 1' })
        .where('organizationId = :orgId', { orgId: task.organizationId })
        .andWhere('order > :oldOrder', { oldOrder })
        .andWhere('order <= :newOrder', { newOrder })
        .execute();
    } else if (newOrder < oldOrder) {
      await this.taskRepository
        .createQueryBuilder()
        .update(Task)
        .set({ order: () => '"order" + 1' })
        .where('organizationId = :orgId', { orgId: task.organizationId })
        .andWhere('order >= :newOrder', { newOrder })
        .andWhere('order < :oldOrder', { oldOrder })
        .execute();
    }

    task.order = newOrder;
    if (newStatus) {
      task.status = newStatus;
    }

    const savedTask = await this.taskRepository.save(task);

    await this.auditService.logTaskAction(
      user.id,
      user.email,
      user.organizationId,
      AuditAction.UPDATE,
      savedTask.id,
      { reordered: true, oldOrder, newOrder, oldStatus, newStatus }
    );

    return savedTask;
  }
}
