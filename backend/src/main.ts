import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import cookieParser from 'cookie-parser';
import express from 'express';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from './app.module';
import { AUTH_COOKIE_NAME, COOKIE_AUTH_SCHEME } from './auth/auth.constants';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const frontendUrl = config.getOrThrow<string>('FRONTEND_URL');
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.enableCors({ origin: frontendUrl, credentials: true });
  app.enableCsrfProtection({ trustedOrigins: [frontendUrl] });
  const uploadDirectory = resolve(config.getOrThrow<string>('UPLOAD_DIR'), 'work-requests');
  await mkdir(uploadDirectory, { recursive: true });
  app.use('/uploads/work-requests', express.static(uploadDirectory, {
    dotfiles: 'deny',
    index: false,
    fallthrough: false,
  }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableShutdownHooks();

  const openApiConfig = new DocumentBuilder()
    .setTitle('Mero Event API')
    .setDescription('Vendor Bidding and Booking System API')
    .setVersion('1.0.0')
    .addCookieAuth(AUTH_COOKIE_NAME, { type: 'apiKey', in: 'cookie' }, COOKIE_AUTH_SCHEME)
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);
  app.use('/api/reference', apiReference({ content: openApiDocument }));

  await app.listen(config.getOrThrow<number>('PORT'), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Application startup failed', 'Bootstrap');
  process.exit(1);
});
