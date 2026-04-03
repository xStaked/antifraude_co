import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Aumentar límite para imágenes en base64
  app.use(json({ limit: '10mb' }));
  
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: [
      process.env.PUBLIC_WEB_URL ?? 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3002',
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
