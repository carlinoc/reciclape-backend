import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import * as admin from 'firebase-admin';

interface NeighborProximity {
  id: string;
  fcmToken: string;
  street: string;
}

interface NeighborTimeBased {
  id: string;
  fcmToken: string;
  street: string;
  notifyBefore: number;
  distanceMeters: number;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  private readonly PROXIMITY_RADIUS_METERS = 200;
  private readonly TIME_BASED_MAX_RADIUS_METERS = 16000;
  private readonly MIN_SPEED_KMH = 5;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async processTruckGeofence(
    truckId: string,
    plate: string,
    lat: number,
    lng: number,
    speedKmh: number,
  ) {
    if (speedKmh < this.MIN_SPEED_KMH) return;

    await Promise.allSettled([
      this.processProximityNotifications(truckId, plate, lat, lng),
      this.processTimeBasedNotifications(truckId, plate, lat, lng, speedKmh),
    ]);
  }

  // ── OPCIÓN A: Radio fijo 200m ─────────────────────────────────────────────
  private async processProximityNotifications(
    truckId: string,
    plate: string,
    lat: number,
    lng: number,
  ) {
    const cacheKey = `neighbors_prox:${lat.toFixed(3)}:${lng.toFixed(3)}`;
    const cachedData = await this.redis.get(cacheKey);

    let neighbors: NeighborProximity[];

    if (!cachedData) {
      neighbors = await this.dataSource.query(`
        SELECT u.id, u."fcmToken", a.street
        FROM users u
        INNER JOIN addresses a ON u.id = a."userId"
        WHERE u."isActive" = true
          AND u."fcmToken" IS NOT NULL
          AND a."notifyBefore" IS NULL
          AND ST_DWithin(
            a.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
        LIMIT 100
      `, [lng, lat, this.PROXIMITY_RADIUS_METERS]);

      await this.redis.set(cacheKey, JSON.stringify(neighbors), 'EX', 120);
    } else {
      neighbors = JSON.parse(cachedData) as NeighborProximity[];
    }

    if (!neighbors?.length) return;

    await Promise.allSettled(
      neighbors.map(neighbor =>
        this.sendIfNotLocked(
          neighbor.id,
          neighbor.fcmToken,
          truckId,
          plate,
          'proximity',
          `¡Camión cerca! El recolector (${plate}) está a menos de 200m de tu domicilio en ${neighbor.street}.`,
        ),
      ),
    );
  }

  // ── OPCIÓN B: Tiempo estimado (5, 10 o 15 min) ───────────────────────────
  private async processTimeBasedNotifications(
    truckId: string,
    plate: string,
    lat: number,
    lng: number,
    speedKmh: number,
  ) {
    const speedMs = speedKmh / 3.6;
    const maxDistanceFor15Min = speedMs * 15 * 60;
    const searchRadius = Math.min(maxDistanceFor15Min, this.TIME_BASED_MAX_RADIUS_METERS);

    const speedBucket = Math.round(speedKmh / 5) * 5;
    const cacheKey = `neighbors_time:${lat.toFixed(3)}:${lng.toFixed(3)}:${speedBucket}`;
    const cachedData = await this.redis.get(cacheKey);

    let neighbors: NeighborTimeBased[];

    if (!cachedData) {
      neighbors = await this.dataSource.query(`
        SELECT
          u.id,
          u."fcmToken",
          a.street,
          a."notifyBefore",
          ROUND(
            ST_Distance(
              a.location,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            )
          ) AS "distanceMeters"
        FROM users u
        INNER JOIN addresses a ON u.id = a."userId"
        WHERE u."isActive" = true
          AND u."fcmToken" IS NOT NULL
          AND a."notifyBefore" IS NOT NULL
          AND ST_DWithin(
            a.location,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $3
          )
        LIMIT 150
      `, [lng, lat, searchRadius]);

      await this.redis.set(cacheKey, JSON.stringify(neighbors), 'EX', 60);
    } else {
      neighbors = JSON.parse(cachedData) as NeighborTimeBased[];
    }

    if (!neighbors?.length) return;

    await Promise.allSettled(
      neighbors.map(neighbor =>
        this.evaluateTimeBasedNeighbor(neighbor, truckId, plate, speedMs),
      ),
    );
  }

  private async evaluateTimeBasedNeighbor(
    neighbor: NeighborTimeBased,
    truckId: string,
    plate: string,
    speedMs: number,
  ) {
    const distanceMeters = Number(neighbor.distanceMeters);
    const notifyBefore = neighbor.notifyBefore;

    if (speedMs <= 0) return;

    const etaMinutes = distanceMeters / speedMs / 60;

    // Ventana de 1 minuto alrededor del notifyBefore configurado
    // Ejemplo: notifyBefore=10 → notifica cuando ETA está entre 9 y 10 min
    const windowMax = notifyBefore;
    const windowMin = notifyBefore - 1;

    if (etaMinutes > windowMax || etaMinutes < windowMin) return;

    const etaText =
      notifyBefore === 5 ? '5 minutos' :
      notifyBefore === 10 ? '10 minutos' : '15 minutos';

    await this.sendIfNotLocked(
      neighbor.id,
      neighbor.fcmToken,
      truckId,
      plate,
      'time_based',
      `⏱ El camión recolector (${plate}) llegará a ${neighbor.street} en aproximadamente ${etaText}.`,
    );
  }

  // ── Lock anti-spam ─────────────────────────────────────────────────────────
  private async sendIfNotLocked(
    userId: string,
    fcmToken: string,
    truckId: string,
    plate: string,
    mode: 'proximity' | 'time_based',
    message: string,
  ) {
    const lockKey = `notif_lock:${mode}:${userId}:${truckId}`;
    const isLocked = await this.redis.get(lockKey);
    if (isLocked) return;

    const title = mode === 'proximity' ? '¡Camión cerca!' : '⏱ El camión se acerca';

    await this.sendAndSaveNotification(userId, fcmToken, title, message, {
      truckId,
      plate,
      mode,
    });

    await this.redis.set(lockKey, '1', 'EX', 3600);
  }

  // ── Firebase + DB ──────────────────────────────────────────────────────────
  private async sendAndSaveNotification(
    userId: string,
    token: string,
    title: string,
    message: string,
    data: Record<string, string>,
  ) {
    try {
      this.notificationRepo
        .save(
          this.notificationRepo.create({
            userId,
            type: 'TRUCK_PROXIMITY',
            title,
            message,
            data,
          }),
        )
        .catch(err => this.logger.error(`DB save error: ${err.message}`));

      await admin.messaging().send({
        token,
        notification: { title, body: message },
        data: { truckId: data.truckId, type: 'TRUCK_PROXIMITY', mode: data.mode },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } },
      });
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token') {
        await this.dataSource.query(
          `UPDATE users SET "fcmToken" = NULL WHERE id = $1`,
          [userId],
        );
        this.logger.warn(`Token inválido limpiado para usuario ${userId}`);
      } else {
        this.logger.error(`Push error para usuario ${userId}: ${error.message}`);
      }
    }
  }

  // ── Métodos existentes ─────────────────────────────────────────────────────
  async markAsRead(id: string) {
    return await this.notificationRepo.update(id, {
      isRead: true,
      readAt: new Date(),
    });
  }

  async markAllAsRead(userId: string) {
    return await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  async getGlobalStats() {
    const totalSent = await this.notificationRepo.count();
    const totalRead = await this.notificationRepo.count({ where: { isRead: true } });
    const effectiveness = totalSent > 0 ? (totalRead / totalSent) * 100 : 0;

    return {
      totalSent,
      totalRead,
      effectivenessPercentage: effectiveness.toFixed(2),
      lastNotifications: await this.notificationRepo.find({
        take: 5,
        order: { sentAt: 'DESC' },
      }),
    };
  }
}
