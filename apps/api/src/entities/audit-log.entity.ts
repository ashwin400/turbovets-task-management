import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AuditAction } from '@arao-5db7e763-d567-4c90-b836-3ebf57b9cc25/data';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  userId: string;

  @ManyToOne(() => User, (user) => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'text', length: 255 })
  userEmail: string;

  @Column({
    type: 'text',
  })
  action: AuditAction;

  @Column({ type: 'text', length: 100 })
  resource: string;

  @Column({ type: 'text', nullable: true })
  resourceId: string | null;

  @Column({ type: 'text', nullable: true })
  details: string | null; // JSON stringified

  @Column({ type: 'text', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ type: 'text', nullable: true })
  userAgent: string | null;

  @Column({ type: 'text' })
  organizationId: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @CreateDateColumn()
  createdAt: Date;

  // Helper to get parsed details
  getDetails(): Record<string, unknown> | null {
    if (!this.details) return null;
    try {
      return JSON.parse(this.details);
    } catch {
      return null;
    }
  }

  // Helper to set details
  setDetails(details: Record<string, unknown>): void {
    this.details = JSON.stringify(details);
  }
}
