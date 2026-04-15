import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  // SEC-02/SEC-05: orígenes leídos desde variable de entorno, no hardcodeados.
  // En producción: ALLOWED_ORIGINS=https://panel.reciclape.pe,https://app.reciclape.pe
  const allowedOrigins = (
    process.env.ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:3001,http://localhost:4200,http://localhost:5173'
  )
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Permitir: orígenes configurados, null (iframes/simuladores) y sin origen (mobile/curl)
      if (!origin || origin === 'null' || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ── Validación global ─────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,             // Convierte string→boolean, string→number, etc.
      whitelist: true,             // Elimina propiedades no declaradas en el DTO
      forbidNonWhitelisted: true,  // Lanza error si llegan propiedades extra
    }),
  );

  // ── Swagger ───────────────────────────────────────────────────────────────
  // Solo activo fuera de producción.
  // Para probar endpoints protegidos en /docs:
  //   1. Llama a POST /auth/admins/login con email y password
  //   2. Copia el accessToken de la respuesta
  //   3. Haz clic en el botón "Authorize 🔒" (arriba a la derecha)
  //   4. Pega el token en el campo "Value" y haz clic en "Authorize"
  //   5. Todos los endpoints protegidos ya funcionarán desde Swagger
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('API ReciclaPE')
      .setDescription(
        '## Autenticación\n\n' +
        'La mayoría de endpoints requieren JWT. Para probarlos:\n\n' +
        '**1.** Usa `POST /auth/admins/login` (o neighbors/login) para obtener el `accessToken`\n\n' +
        '**2.** Haz clic en el botón **Authorize 🔒** (arriba a la derecha)\n\n' +
        '**3.** Pega el token y haz clic en **Authorize**\n\n' +
        '**Endpoints públicos** (no requieren token): `/auth/*`, `POST /truck-positions`, `/departments`, `/provinces`, `/districts`'
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Pega aquí el accessToken obtenido del login',
          in: 'header',
        },
        'JWT-auth',  // nombre de referencia
      )
      .addSecurityRequirements('JWT-auth')  // Aplica el token a TODOS los endpoints por defecto
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,  // Mantiene el token entre recargas de página
      },
    });
    console.log(`📖 Swagger: http://localhost:${process.env.PORT ?? 3000}/docs`);
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`✅ Base de datos conectada`);
  console.log(`🚀 Servidor corriendo en: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
