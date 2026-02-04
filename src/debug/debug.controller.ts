import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Notification } from '../notifications/entities/notification.entity';
import { TruckPosition } from '../truck-positions/entities/truck-position.entity';
import { TestNotificationDto } from './dto/test-notification.dto';
import * as admin from 'firebase-admin';

@ApiTags('Debug & Testing')
@Controller('debug')
export class DebugController {
  constructor(
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(TruckPosition)
    private positionRepo: Repository<TruckPosition>,
    private readonly dataSource: DataSource,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  /**
   * Ver estado de Redis y throttling
   */
  @Get('redis-status')
  @ApiOperation({ summary: 'Verificar estado de Redis y claves activas' })
  async getRedisStatus() {
    try {
      const keys = await this.redis.keys('*');
      const throttleKeys = keys.filter(k => k.startsWith('gps_throttle:'));
      const lockKeys = keys.filter(k => k.startsWith('notif_lock:'));
      const cacheKeys = keys.filter(k => k.startsWith('neighbors:'));

      const throttleDetails = await Promise.all(
        throttleKeys.map(async (key) => ({
          key,
          ttl: await this.redis.ttl(key),
          value: await this.redis.get(key)
        }))
      );

      const lockDetails = await Promise.all(
        lockKeys.slice(0, 10).map(async (key) => ({ // Solo los primeros 10
          key,
          ttl: await this.redis.ttl(key)
        }))
      );

      return {
        status: 'connected',
        totalKeys: keys.length,
        throttleActive: throttleKeys.length,
        notificationLocksActive: lockKeys.length,
        cacheActive: cacheKeys.length,
        throttleDetails,
        lockDetails: lockDetails.length > 0 ? lockDetails : 'No hay locks activos',
        message: 'Redis funcionando correctamente ✅'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        suggestion: 'Verifica que Redis esté corriendo: docker ps o redis-cli ping'
      };
    }
  }

  /**
   * Buscar vecinos cercanos a unas coordenadas (simula la geocerca)
   */
  @Get('neighbors-near')
  @ApiOperation({ summary: 'Encontrar vecinos cerca de una coordenada' })
  async findNeighborsNear(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius: number = 200
  ) {
    const neighbors = await this.dataSource.query(`
      SELECT 
        u.id,
        u.email,
        u."fcmToken",
        a.street,
        a.number,
        ST_Distance(
          a.location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters,
        ST_AsText(a.location) as location_wkt
      FROM users u
      JOIN addresses a ON u.id = a."userId"
      WHERE u."isActive" = true 
        AND ST_DWithin(
          a.location, 
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography, 
          $3
        )
      ORDER BY distance_meters ASC
    `, [lng, lat, radius]);

    return {
      searchPoint: { latitude: lat, longitude: lng },
      radiusMeters: radius,
      neighborsFound: neighbors.length,
      neighbors: neighbors.map(n => ({
        userId: n.id,
        email: n.email,
        hasFcmToken: !!n.fcmToken,
        street: n.street,
        number: n.number,
        distanceMeters: Math.round(n.distance_meters),
        coordinates: n.location_wkt
      }))
    };
  }

  /**
   * Ver últimas notificaciones enviadas
   */
  @Get('recent-notifications')
  @ApiOperation({ summary: 'Ver últimas 20 notificaciones' })
  async getRecentNotifications() {
    const notifications = await this.notificationRepo.find({
      take: 20,
      order: { sentAt: 'DESC' },
      select: ['id', 'userId', 'type', 'title', 'message', 'isRead', 'sentAt', 'readAt']
    });

    return {
      total: notifications.length,
      notifications
    };
  }

  /**
   * Ver últimas posiciones GPS recibidas
   */
  @Get('recent-positions')
  @ApiOperation({ summary: 'Ver últimas 20 posiciones GPS' })
  async getRecentPositions() {
    const positions = await this.positionRepo.find({
      take: 20,
      order: { timestamp: 'DESC' },
      relations: ['truck']
    });

    return {
      total: positions.length,
      positions: positions.map(p => ({
        id: p.id,
        truckId: p.truckId,
        plate: p.truck?.licensePlate || 'N/A',
        latitude: p.location.coordinates[1],
        longitude: p.location.coordinates[0],
        speed: p.speed,
        heading: p.heading,
        timestamp: p.timestamp
      }))
    };
  }

  /**
   * Limpiar caché de Redis (útil para pruebas)
   */
  @Post('clear-redis-cache')
  @ApiOperation({ summary: 'Limpiar todas las claves de Redis (¡CUIDADO!)' })
  async clearRedisCache(@Body() body: { pattern?: string }) {
    try {
      const pattern = body.pattern || '*';
      const keys = await this.redis.keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      return {
        message: 'Cache limpiado exitosamente',
        keysDeleted: keys.length,
        pattern
      };
    } catch (error) {
      return {
        message: 'Error limpiando cache',
        error: error.message
      };
    }
  }

  /**
   * Resetear locks de notificaciones (útil para pruebas repetidas)
   */
  @Post('reset-notification-locks')
  @ApiOperation({ summary: 'Eliminar todos los locks de notificaciones' })
  async resetNotificationLocks() {
    const keys = await this.redis.keys('notif_lock:*');
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    return {
      message: 'Locks de notificaciones reseteados',
      locksRemoved: keys.length,
      info: 'Ahora puedes recibir notificaciones inmediatamente'
    };
  }

  /**
   * Estadísticas generales del sistema
   */
  @Get('system-stats')
  @ApiOperation({ summary: 'Estadísticas generales del sistema' })
  async getSystemStats() {
    const [
      totalPositions,
      totalNotifications,
      notificationsRead,
      activeUsers,
      redisKeys
    ] = await Promise.all([
      this.positionRepo.count(),
      this.notificationRepo.count(),
      this.notificationRepo.count({ where: { isRead: true } }),
      this.dataSource.query(`SELECT COUNT(*) as count FROM users WHERE "isActive" = true`),
      this.redis.keys('*')
    ]);

    // Posiciones en la última hora
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentPositions = await this.positionRepo.count({
      where: { timestamp: oneHourAgo }
    });

    return {
      positions: {
        total: totalPositions,
        lastHour: recentPositions
      },
      notifications: {
        total: totalNotifications,
        read: notificationsRead,
        unread: totalNotifications - notificationsRead,
        readRate: totalNotifications > 0 ? ((notificationsRead / totalNotifications) * 100).toFixed(2) + '%' : '0%'
      },
      users: {
        active: activeUsers[0].count
      },
      redis: {
        totalKeys: redisKeys.length,
        throttleKeys: redisKeys.filter(k => k.startsWith('gps_throttle:')).length,
        lockKeys: redisKeys.filter(k => k.startsWith('notif_lock:')).length,
        cacheKeys: redisKeys.filter(k => k.startsWith('neighbors:')).length
      }
    };
  }

  /**
   * Probar envío de notificación manual
   */
  @Post('test-notification')
  @ApiOperation({ summary: 'Enviar notificación de prueba a un usuario' })
  async testNotification(@Body() body: TestNotificationDto) {
    try {
      // Buscar usuario
      const user = await this.dataSource.query(
        `SELECT id, email, "fcmToken" FROM users WHERE id = $1`,
        [body.userId]
      );

      if (!user || user.length === 0) {
        return { 
          success: false, 
          message: 'Usuario no encontrado' 
        };
      }

      const fcmToken = user[0].fcmToken;
      if (!fcmToken) {
        return { 
          success: false, 
          message: 'Usuario no tiene FCM Token registrado',
          suggestion: 'El usuario debe abrir la app y permitir notificaciones'
        };
      }

      const title = body.title || '🧪 Prueba de Notificación';
      const message = body.message || 'Esta es una notificación de prueba desde el sistema de debug';

      // Guardar en DB
      const notification = this.notificationRepo.create({
        userId: body.userId,
        type: 'TEST',
        title,
        message,
        data: { test: true }
      });
      await this.notificationRepo.save(notification);
      
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body: message },
        data: { type: 'TEST' },
        android: { priority: 'high' },
        apns: { headers: { 'apns-priority': '10' } }
      });
      
      return {
        success: true,
        message: 'Notificación creada en DB',
        notification
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}
