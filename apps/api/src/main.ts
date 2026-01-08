/**
 * Secure Task Management System API
 * NestJS backend with RBAC and JWT authentication
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  const port = process.env['PORT'] || 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
  Logger.log(`📚 API Endpoints:`);
  Logger.log(`   POST /api/auth/register - Register new user`);
  Logger.log(`   POST /api/auth/login - Login`);
  Logger.log(`   GET  /api/auth/me - Get current user`);
  Logger.log(`   GET  /api/tasks - List tasks`);
  Logger.log(`   POST /api/tasks - Create task`);
  Logger.log(`   PUT  /api/tasks/:id - Update task`);
  Logger.log(`   DELETE /api/tasks/:id - Delete task`);
  Logger.log(`   GET  /api/audit-log - View audit logs (Owner/Admin only)`);
}

bootstrap();
