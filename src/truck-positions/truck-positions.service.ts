import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckPosition } from './entities/truck-position.entity';
import { CreateTruckPositionDto } from './dto/create-truck-position.dto';
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
    private readonly truckGateway: TruckPositionsGateway, // Inyectamos el Gateway
    private readonly notificationsService: NotificationsService, // Inyectamos el servicio de notificaciones
    @InjectRedis() private readonly redis: any, // Inyectamos Redis
  ) {}

  async create(dto: CreateTruckPositionDto) {
    const lastPosKey = `last_pos:${dto.truckId}`;
    const lastPos = await this.redis.get(lastPosKey);
    
    if (lastPos) {
      const last = JSON.parse(lastPos);
      const distance = this.getDistance(last.lat, last.lng, dto.latitude, dto.longitude);
      // Si se movió menos de 5 metros, ignorar persistencia para ahorrar DB
      if (distance < 5) return { status: 'idle' };
    }
    // Guardar en Redis la nueva posición "Hot"
    await this.redis.set(lastPosKey, JSON.stringify({ lat: dto.latitude, lng: dto.longitude }), 'EX', 3600); // Expira en 1 hora

    const throttleKey = `gps_throttle:${dto.truckId}`;
  
    // Solo procesar cada 5 segundos por camión
    const lastUpdate = await this.redis.get(throttleKey);
    if (lastUpdate) {
      // Guardar posición pero NO emitir ni notificar
      return this.positionRepo.save(this.positionRepo.create({
        truckId: dto.truckId,
        speed: dto.speed,
        heading: dto.heading,
        accuracy: dto.accuracy,
        location: { type: 'Point', coordinates: [dto.longitude, dto.latitude] },
      }));
    }

    await this.redis.set(throttleKey, Date.now().toString(), 'EX', 5); //Se guarda por 5 segundos

    // 1. Creamos la instancia de la posición
    const position = this.positionRepo.create({
      truckId: dto.truckId,
      speed: dto.speed,
      heading: dto.heading,
      accuracy: dto.accuracy,
      location: {
        type: 'Point',
        coordinates: [dto.longitude, dto.latitude],
      },
    });

    // 2. Guardamos en la base de datos
    const savedPosition = await this.positionRepo.save(position);

    // 3. Cachear placa del camión
    const plateKey = `truck:plate:${dto.truckId}`;
    let plate = await this.redis.get(plateKey);

    if (!plate) {
      const truck = await this.truckRepo.findOne({ where: { id: dto.truckId } });
      if (truck) {
        plate = truck.licensePlate;
        await this.redis.set(plateKey, plate, 'EX', 86400); //Se guarda por 1 día
      }
    }

    // 4. EMITIR AL MAPA (WebSocket)
    const positionData = {
      truckId: savedPosition.truckId,
      plate: plate,
      latitude: dto.latitude,
      longitude: dto.longitude,
      heading: dto.heading,
      speed: dto.speed,
      timestamp: savedPosition.timestamp,
    };

    this.truckGateway.emitTruckMovement(positionData);

    // 5. PROCESAR GEOCERCA (Push Notifications)
    if ((dto.speed ?? 0) >= 10) {
      // No usamos 'await' para que la respuesta al GPS sea instantánea
      this.notificationsService.processTruckGeofence(
        savedPosition.truckId,
        plate,
        dto.latitude,
        dto.longitude
      ).catch(err => console.error('Error en proceso de Geocerca:', err));
    }

    return savedPosition;
  }

  // Obtener la última posición conocida de todos los camiones
  async getLatestPositions() {
    return await this.positionRepo.createQueryBuilder('tp')
      .distinctOn(['tp.truckId'])
      .orderBy('tp.truckId')
      .addOrderBy('tp.timestamp', 'DESC')
      .getMany();
  }

  private getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }
}
