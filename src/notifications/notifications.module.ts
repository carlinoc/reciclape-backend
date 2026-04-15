import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import * as admin from 'firebase-admin';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    // CRIT-03 FIX: Se eliminó el RedisModule.forRoot() hardcodeado con localhost:6379.
    // El RedisModule global registrado en AppModule ya inyecta Redis correctamente
    // en toda la aplicación usando la variable de entorno REDIS_URL.
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule implements OnModuleInit {
  onModuleInit() {
    // CRIT-02 FIX: Firebase se inicializa desde variables de entorno, no desde archivo.
    // Esto elimina la dependencia del archivo firebase-config.json en el servidor
    // y permite gestionar las credenciales de forma segura en el .env del VPS.
    //
    // Variables requeridas en .env:
    //   FIREBASE_PROJECT_ID=reciclape-xxxxx
    //   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@reciclape-xxxxx.iam.gserviceaccount.com
    //   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
    //   (copiar la clave del firebase-config.json, los \n deben ser literales en el .env)
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId:   process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Los \n literales del .env se convierten a saltos de línea reales
          privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      });
    }
  }
}
