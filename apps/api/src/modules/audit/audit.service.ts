import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditLog } from '../../entities/audit-log.entity';
import {
  AuditAction,
  ICreateAuditLog,
  IAuditLogFilters,
} from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>
  ) {}

  async log(data: ICreateAuditLog): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      ...data,
      details: data.details ? JSON.stringify(data.details) : null,
    });

    await this.auditLogRepository.save(auditLog);

    // Also log to console for visibility
    console.log(
      `[AUDIT] ${data.action.toUpperCase()} - ${data.resource}${data.resourceId ? `:${data.resourceId}` : ''} by ${data.userEmail} (Org: ${data.organizationId})`
    );

    return auditLog;
  }

  async findAll(
    organizationId: string,
    filters?: IAuditLogFilters,
    page = 1,
    limit = 50
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where: FindOptionsWhere<AuditLog> = { organizationId };

    if (filters?.userId) {
      where.userId = filters.userId;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (filters?.resource) {
      where.resource = filters.resource;
    }

    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(filters.startDate, filters.endDate);
    }

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
      relations: ['user'],
    });

    return { data, total };
  }

  async logTaskAction(
    userId: string,
    userEmail: string,
    organizationId: string,
    action: AuditAction,
    taskId?: string,
    details?: Record<string, unknown>,
    request?: { ip?: string; headers?: Record<string, string> }
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: 'task',
      resourceId: taskId,
      details,
      organizationId,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }

  async logAuthAction(
    userId: string,
    userEmail: string,
    organizationId: string,
    action: AuditAction.LOGIN | AuditAction.LOGOUT | AuditAction.ACCESS_DENIED,
    details?: Record<string, unknown>,
    request?: { ip?: string; headers?: Record<string, string> }
  ): Promise<void> {
    await this.log({
      userId,
      userEmail,
      action,
      resource: 'auth',
      details,
      organizationId,
      ipAddress: request?.ip,
      userAgent: request?.headers?.['user-agent'],
    });
  }
}
