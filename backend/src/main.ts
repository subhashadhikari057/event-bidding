import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: config.getOrThrow<string>('FRONTEND_URL') });
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Mero Event API')
    .setDescription('Vendor Bidding and Booking System API')
    .setVersion('1.0.0')
    .build();
  SwaggerModule.setup('api/docs', app, () => SwaggerModule.createDocument(app, swaggerConfig));
  app.use('/api/reference', apiReference({ url: '/api/docs-json' }));

  await app.listen(config.getOrThrow<number>('PORT'), '0.0.0.0');
}

bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Application startup failed', 'Bootstrap');
  process.exit(1);
});
