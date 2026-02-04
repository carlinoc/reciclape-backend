import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:8081',
      'http://localhost:19006',
      'http://192.168.100.159:8081',
      'https://reciclape.onrender.com',
      'null'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Habilita validación global con transformación automática
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Transforma automáticamente los tipos (string a boolean, etc.)
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades extra
    }),
  );

  // 🔥 Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('API ReciclaPE')
    .setDescription('Documentación de la API de ReciclaPE')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);

  console.log(`✅ Database connected successfully`);
  console.log(`🚀 Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();