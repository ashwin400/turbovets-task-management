import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../modules/auth/auth.module';
import { JwtAuthGuard } from '../modules/auth/jwt-auth.guard';
import { TaskModule } from '../modules/task/task.module';
import { AuditModule } from '../modules/audit/audit.module';
import { OrganizationModule } from '../modules/organization/organization.module';
import { Organization, User, Task, AuditLog } from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: process.env['DATABASE_PATH'] || 'data/task-management.db',
      entities: [Organization, User, Task, AuditLog],
      synchronize: true, // Set to false in production
      logging: process.env['NODE_ENV'] === 'development',
    }),
    AuthModule,
    TaskModule,
    AuditModule,
    OrganizationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply JWT guard globally
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
