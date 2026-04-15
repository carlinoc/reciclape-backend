import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckPosition } from './entities/truck-position.entity';
import { CreateTruckPositionDto } from './dto/create-truck-position.dto';
import { FilterTruckPositionsDto } from './dto/filter-truck-positions.dto';
import { TruckPositionsGateway } from './truck-positions.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { InjectRedis } from '@nestjs-modules/ioredis/dist/redis.decorators';
import { Truck } from 'src/trucks/entities/truck.entity';

@Injectable()
export class TruckPositionsService {
  constructor(
    @InjectRepository(TruckPosition)
    private positionRepo: Repository<TruckPosition>,
    @InjectRepository(Truck)
    private truckRepo: Repository<Truck>,
    private readonly truckGateway: TruckPositionsGateway,
    private readonly notificationsService: NotificationsService,
    @InjectRedis() private readonly redis: any,
  ) {}

  // ── CREAR POSICIÓN GPS ────────────────────────────────────────────────────
  async create(dto: CreateTruckPositionDto) {
    const lastPosKey = `last_pos:${dto.truckId}`;
    const lastPos = await this.redis.get(lastPosKey);

    if (lastPos) {
      const last = JSON.parse(lastPos);
      const distance = this.getDistance(last.lat, last.lng, dto.latitude, dto.longitude);
      if (distance < 5) return { status: 'idle' };
    }
    await this.redis.set(lastPosKey, JSON.stringify({ lat: dto.latitude, lng: dto.longitude }), 'EX', 3600);

    const throttleKey = `gps_throttle:${dto.truckId}`;
    const lastUpdate = await this.redis.get(throttleKey);
    if (lastUpdate) {
      return { status: 'throttled' };
    }
    await this.redis.set(throttleKey, Date.now().toString(), 'EX', 5);

    const position = this.positionRepo.create({
      truckId: dto.truckId,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
    });

    const savedPosition = await this.positionRepo.save(position);

    const plateKey = `truck:plate:${dto.truckId}`;
    let plate = await this.redis.get(plateKey);
    if (!plate) {
      const truck = await this.truckRepo.findOne({ where: { id: dto.truckId } });
      if (truck) {
        plate = truck.licensePlate;
        await this.redis.set(plateKey, plate, 'EX', 86400);
      }
    }

    this.truckGateway.emitTruckMovement({
      truckId: savedPosition.truckId,
      plate,
      latitude: dto.latitude,
      longitude: dto.longitude,
      heading: dto.heading,
      speed: dto.speed,
      timestamp: savedPosition.timestamp,
    });

    this.redis.del('latest_positions:all').catch(() => {});

    const speedKmh = dto.speed ?? 0;
    if (speedKmh >= 5) {
      this.notificationsService.processTruckGeofence(
        savedPosition.truckId,
        plate,
        dto.latitude,
        dto.longitude,
        speedKmh,
      ).catch(err => console.error('Error en proceso de Geocerca:', err));
    }

    return savedPosition;
  }

  // ── POSICIONES MÁS RECIENTES (mapa en vivo) ───────────────────────────────
  // ALTO-01 FIX: caché Redis 10s — evita seq scan sobre millones de filas
  async getLatestPositions() {
    const cacheKey = 'latest_positions:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const positions = await this.positionRepo.createQueryBuilder('tp')
      .distinctOn(['tp.truckId'])
      .orderBy('tp.truckId')
      .addOrderBy('tp.timestamp', 'DESC')
      .getMany();

    const formatted = positions.map(p => this.formatPosition(p));
    await this.redis.set(cacheKey, JSON.stringify(formatted), 'EX', 10);
    return formatted;
  }

  // ── HISTORIAL DE RECORRIDO ────────────────────────────────────────────────
  async getHistory(filters: FilterTruckPositionsDto) {
    const { truckId, from, to, preset, limit = 500 } = filters;

    const qb = this.positionRepo
      .createQueryBuilder('tp')
      .orderBy('tp.timestamp', 'ASC')
      .take(limit);

    if (truckId) qb.andWhere('tp.truckId = :truckId', { truckId });

    const { dateFrom, dateTo } = this.resolveDateRange(from, to, preset);

    if (dateFrom) qb.andWhere('tp.timestamp >= :dateFrom', { dateFrom });
    if (dateTo)   qb.andWhere('tp.timestamp <  :dateTo',   { dateTo });

    const [data, total] = await qb.getManyAndCount();
    const formatted = data.map(p => this.formatPosition(p));

    return {
      total,
      returned: formatted.length,
      hasMore: total > formatted.length,
      dateRange: { from: dateFrom, to: dateTo },
      filters: { truckId, preset, limit },
      data: formatted,
    };
  }

  // ── ÚLTIMAS N POSICIONES DEL DÍA ─────────────────────────────────────────
  async getLastNToday(truckId: string, n: number = 50) {
    const { dateFrom } = this.resolveDateRange(undefined, undefined, 'today');
    const data = await this.positionRepo.createQueryBuilder('tp')
      .where('tp.truckId = :truckId', { truckId })
      .andWhere('tp.timestamp >= :dateFrom', { dateFrom })
      .orderBy('tp.timestamp', 'DESC')
      .take(n)
      .getMany();
    return {
      truckId, period: 'today', limit: n,
      returned: data.length,
      data: data.reverse().map(p => this.formatPosition(p)),
    };
  }

  // ── ÚLTIMAS N POSICIONES DE LA SEMANA ────────────────────────────────────
  async getLastNWeek(truckId: string, n: number = 50) {
    const { dateFrom } = this.resolveDateRange(undefined, undefined, 'week');
    const data = await this.positionRepo.createQueryBuilder('tp')
      .where('tp.truckId = :truckId', { truckId })
      .andWhere('tp.timestamp >= :dateFrom', { dateFrom })
      .orderBy('tp.timestamp', 'DESC')
      .take(n)
      .getMany();
    return {
      truckId, period: 'week', limit: n,
      returned: data.length,
      data: data.reverse().map(p => this.formatPosition(p)),
    };
  }

  // ── ÚLTIMAS N POSICIONES DEL MES ─────────────────────────────────────────
  async getLastNMonth(truckId: string, n: number = 50) {
    const { dateFrom } = this.resolveDateRange(undefined, undefined, 'month');
    const data = await this.positionRepo.createQueryBuilder('tp')
      .where('tp.truckId = :truckId', { truckId })
      .andWhere('tp.timestamp >= :dateFrom', { dateFrom })
      .orderBy('tp.timestamp', 'DESC')
      .take(n)
      .getMany();
    return {
      truckId, period: 'month', limit: n,
      returned: data.length,
      data: data.reverse().map(p => this.formatPosition(p)),
    };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  private resolveDateRange(from?: string, to?: string, preset?: string): { dateFrom?: Date; dateTo?: Date } {
    if (from || to) {
      return { dateFrom: from ? new Date(from) : undefined, dateTo: to ? new Date(to) : undefined };
    }
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    switch (preset) {
      case 'today':
        return { dateFrom: startOfToday };
      case 'yesterday':
        return { dateFrom: new Date(startOfToday.getTime() - 86_400_000), dateTo: startOfToday };
      case 'week': case 'last7days':
        return { dateFrom: new Date(startOfToday.getTime() - 7 * 86_400_000) };
      case 'month': case 'last30days':
        return { dateFrom: new Date(startOfToday.getTime() - 30 * 86_400_000) };
      default:
        return {};
    }
  }

  private formatPosition(p: TruckPosition) {
    const coords = (p.location as any)?.coordinates ?? [];
    return {
      id: p.id,
      truckId: p.truckId,
      latitude:  coords[1] ?? null,
      longitude: coords[0] ?? null,
      speed:     p.speed,
      heading:   p.heading,
      accuracy:  p.accuracy,
      timestamp: p.timestamp,
      timestampISO: p.timestamp ? p.timestamp.toISOString() : null,
      timestampLocal: p.timestamp
        ? p.timestamp.toLocaleString('es-PE', { timeZone: 'America/Lima' })
        : null,
    };
  }

  // ── HELPERS ───────────────────────────────────────────────────────────────
  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R  = 6371e3;
    const f1 = lat1 * Math.PI / 180;
    const f2 = lat2 * Math.PI / 180;
    const df = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;
    const a  = Math.sin(df/2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
