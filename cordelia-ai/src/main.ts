import 'reflect-metadata';
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { ResponseInterceptor } from './common/interceptor/response.interceptor';
import { Logger } from './common/logging/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: false });

  app.use(helmet());

  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  });

  app.setGlobalPrefix('v1');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  Logger.info(`ai-service running on port ${port}`);
}

bootstrap();
