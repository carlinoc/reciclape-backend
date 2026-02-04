import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '@nestjs-modules/ioredis'; // Importa el módulo
import { NotificationsService } from './notifications.service';
import { Notification } from './entities/notification.entity';
import * as admin from 'firebase-admin';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    // AÑADE ESTO:
    RedisModule.forRoot({
      type: 'single',
      options: {
        host: 'localhost', // O la IP de tu Redis
        port: 6379,
      },
    }),
  ],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      const configPath = path.join(process.cwd(), 'firebase-config.json');
      admin.initializeApp({
        credential: admin.credential.cert(configPath),
      });
    }
  }
}
