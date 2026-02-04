import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as admin from 'firebase-admin';

interface Neighbor {
  id: string;
  fcmToken: string;
  street: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  // MÉTODO PRINCIPAL: Se llama desde el GPS Gateway o Service
  async processTruckGeofence(truckId: string, plate: string, lat: number, lng: number) {
    // Cache de vecinos cercanos por 2 minutos
    const cacheKey = `neighbors:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cachedData = await this.redis.get(cacheKey);

    let neighbors: Neighbor[] = []; // Inicializar como array vacío
    
    if (!cachedData) {
      const result = await this.dataSource.query(`
        SELECT u.id, u."fcmToken", a.street
        FROM users u
        INNER JOIN addresses a ON u.id = a."userId"
        WHERE u."isActive" = true 
          AND u."fcmToken" IS NOT NULL
          AND ST_DWithin(
            a.location, 
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 
            200
          )
        LIMIT 100 -- Protección anti-saturación
      `, [lng, lat]);
      
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 120); // Cache por 2 minutos
      neighbors = result;
    } else {
      // Parseamos y aseguramos el tipo
      neighbors = JSON.parse(cachedData) as Neighbor[];
    }

    // Enviar notificaciones en lote (batch)
    if (neighbors && neighbors.length > 0) {
      const promises = neighbors.map(neighbor => 
        this.processNeighborNotification(neighbor, truckId, plate)
      );
      
      await Promise.allSettled(promises);
    }
  }

  private async processNeighborNotification(neighbor: any, truckId: string, plate: string) {
    const lockKey = `notif_lock:${neighbor.id}:${truckId}`;
    const isLocked = await this.redis.get(lockKey);
    if (isLocked) return;

    const title = '¡Camión cerca!';
    const message = `El recolector (${plate}) está por llegar a ${neighbor.street}`;

    await this.sendAndSaveNotification(
      neighbor.id, 
      neighbor.fcmToken, 
      title, 
      message, 
      { truckId, plate }
    );

    await this.redis.set(lockKey, '1', 'EX', 3600); // Lock por 1 hora
  }

  private async sendAndSaveNotification(userId: string, token: string, title: string, message: string, data: any) {
     try {
      // Guardar en DB de forma asíncrona
      this.notificationRepo.save(
        this.notificationRepo.create({
          userId,
          type: 'TRUCK_PROXIMITY',
          title,
          message,
          data
        })
      ).catch(err => this.logger.error(`DB save error: ${err.message}`));

      // Enviar push (Firebase maneja retries automáticamente)
      await admin.messaging().send({
        token,
        notification: { title, body: message },
        data: { truckId: data.truckId, type: 'TRUCK_PROXIMITY' },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } }
      });

    } catch (error) {
      this.logger.error(error)
      if (error.code === 'messaging/invalid-registration-token') {
        // Limpiar token inválido
        await this.dataSource.query(
          `UPDATE users SET "fcmToken" = NULL WHERE id = $1`,
          [userId]
        );
      }
      this.logger.error(`Push error: ${error.message}`);
    }
  }

  /**
   * Lógica para marcar como leída
   */
  async markAsRead(id: string) {
    return await this.notificationRepo.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
  }

  /**
   * Estadísticas para el Dashboard Municipal
   */
  async getGlobalStats() {
    const totalSent = await this.notificationRepo.count();
    const totalRead = await this.notificationRepo.count({ where: { isRead: true } });
    
    // Cálculo de efectividad (CTR)
    const effectiveness = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

    return {
      totalSent,
      totalRead,
      effectivenessPercentage: effectiveness.toFixed(2),
      lastNotifications: await this.notificationRepo.find({ take: 5, order: { sentAt: 'DESC' } })
    };
  }
}