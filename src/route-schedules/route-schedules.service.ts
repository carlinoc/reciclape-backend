import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteSchedule } from './entities/route-schedule.entity';
import { RouteShift, RouteTurnNumber, ROUTE_SHIFT_LABELS, ROUTE_TURN_LABELS } from './enums/route-schedule.enums';
import { CreateRouteScheduleDto } from './dto/create-route-schedule.dto';
import { UpdateRouteScheduleDto } from './dto/update-route-schedule.dto';
import { FilterRouteSchedulesDto } from './dto/filter-route-schedules.dto';
import { TruckTrip } from '../truck-trips/entities/truck-trip.entity';
import { Truck } from '../trucks/entities/truck.entity';

@Injectable()
export class RouteSchedulesService {
  constructor(
    @InjectRepository(RouteSchedule)
    private readonly routeScheduleRepo: Repository<RouteSchedule>,
    @InjectRepository(TruckTrip)
    private readonly truckTripRepo: Repository<TruckTrip>,
    @InjectRepository(Truck)
    private readonly truckRepo: Repository<Truck>,
  ) {}

  async create(dto: CreateRouteScheduleDto): Promise<RouteSchedule> {
    // Verificar solapamiento: mismo camión + zona + turno + número de turno + días
    // Un mismo camión SÍ puede tener rutas en el mismo día si tienen distinto shift o turnNumber
    const turnNumber = dto.turnNumber ?? RouteTurnNumber.FIRST;
    const conflicting = await this.routeScheduleRepo
      .createQueryBuilder('rs')
      .where('rs.truckId = :truckId', { truckId: dto.truckId })
      .andWhere('rs.zoneId = :zoneId', { zoneId: dto.zoneId })
      .andWhere('rs.shift = :shift', { shift: dto.shift })
      .andWhere('rs.turnNumber = :turnNumber', { turnNumber })
      .andWhere('rs.isArchived = false')
      .andWhere('rs.daysOfWeek && :days::int[]', { days: dto.daysOfWeek })
      .getOne();

    if (conflicting) {
      const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
      const overlap = conflicting.daysOfWeek
        .filter(d => dto.daysOfWeek.includes(d))
        .map(d => dayNames[d - 1])
        .join(', ');
      const shiftLabel  = ROUTE_SHIFT_LABELS[dto.shift];
      const turnLabel   = ROUTE_TURN_LABELS[turnNumber];
      throw new ConflictException(
        `El camión ya tiene una ruta en ${shiftLabel} - ${turnLabel} para: ${overlap}.`,
      );
    }

    const schedule = this.routeScheduleRepo.create(dto);
    return this.routeScheduleRepo.save(schedule);
  }

  async findAll(filter: FilterRouteSchedulesDto) {
    const { municipalityId, zoneId, truckId, dayOfWeek, shift, turnNumber, isMainRoad, isActive } = filter;

    const queryBuilder = this.routeScheduleRepo.createQueryBuilder('routeSchedule')
      .leftJoinAndSelect('routeSchedule.truck', 'truck')
      .leftJoinAndSelect('routeSchedule.zone', 'zone');

    if (municipalityId) queryBuilder.andWhere('truck.municipalityId = :municipalityId', { municipalityId });
    if (zoneId) queryBuilder.andWhere('routeSchedule.zoneId = :zoneId', { zoneId });
    if (truckId) queryBuilder.andWhere('routeSchedule.truckId = :truckId', { truckId });
    if (dayOfWeek  !== undefined) queryBuilder.andWhere(':dayOfWeek = ANY(routeSchedule.daysOfWeek)', { dayOfWeek });
    if (shift      !== undefined) queryBuilder.andWhere('routeSchedule.shift = :shift', { shift });
    if (turnNumber !== undefined) queryBuilder.andWhere('routeSchedule.turnNumber = :turnNumber', { turnNumber });
    if (isMainRoad !== undefined) queryBuilder.andWhere('routeSchedule.isMainRoad = :isMainRoad', { isMainRoad });
    if (isActive !== undefined) {
      queryBuilder.andWhere('routeSchedule.isActive = :isActive', { isActive });
    } else {
      queryBuilder.andWhere('routeSchedule.isActive = true');
    }

    queryBuilder
      .andWhere('routeSchedule.isArchived = false')
      .orderBy('routeSchedule.daysOfWeek', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<RouteSchedule> {
    const schedule = await this.routeScheduleRepo.findOne({
      where: { id },
      relations: ['truck', 'zone'],
    });

    if (!schedule) {
      throw new NotFoundException('Ruta no encontrada');
    }

    return schedule;
  }

  async update(id: string, dto: UpdateRouteScheduleDto): Promise<RouteSchedule> {
    const schedule = await this.findOne(id);
    const dtoAny = dto as any;
    Object.assign(schedule, dto);

    if (dtoAny.truckId) schedule.truck = { id: dtoAny.truckId } as any;
    if (dtoAny.zoneId) schedule.zone = { id: dtoAny.zoneId } as any;

    return this.routeScheduleRepo.save(schedule);
  }

  async remove(id: string) {
    const schedule = await this.findOne(id);
    await this.routeScheduleRepo.remove(schedule);
    return { statusCode: 200, message: 'Ruta eliminada exitosamente' };
  }

  /**
   * Genera un TruckTrip a partir del plan `disposalTrip` guardado en
   * routeSegmentDetails de la ruta indicada.
   *
   * Uso en Etapa 1 (sin app del operador):
   *   El admin abre el panel web al final de la jornada, ve las rutas del día
   *   y hace clic en "Confirmar viaje al botadero". Esto llama a este endpoint.
   *   El TruckTrip se crea pre-rellenado con los datos del plan.
   *   El admin puede editar departedAt antes de confirmar.
   *
   * @param routeScheduleId  UUID de la ruta programada
   * @param departedAt       ISO string con la hora real de salida (opcional,
   *                         por defecto = endTime del día actual + offset del plan)
   */
  async generateTripFromPlan(
    routeScheduleId: string,
    departedAt?: string,
  ): Promise<TruckTrip> {
    // 1. Obtener la ruta con su plan
    const schedule = await this.findOne(routeScheduleId);

    // Compatibilidad: leer disposalSiteId desde "final" (nuevo) o "disposalTrip" (legado)
    const finalPlan = schedule.routeSegmentDetails?.final;
    const legacyPlan = schedule.routeSegmentDetails?.disposalTrip;
    const disposalSiteId = finalPlan?.disposalSiteId ?? legacyPlan?.disposalSiteId;
    const estimatedOffset = legacyPlan?.estimatedDepartureOffsetMinutes ?? 0;

    if (!disposalSiteId) {
      throw new BadRequestException(
        'Esta ruta no tiene disposalSiteId configurado. ' +
        'Agrega routeSegmentDetails.final.disposalSiteId para usar este endpoint.',
      );
    }

    // 2. Resolver municipalityId desde el camión
    const truck = await this.truckRepo.findOne({
      where: { id: schedule.truckId },
      select: ['id', 'municipalityId'],
    });
    if (!truck) {
      throw new NotFoundException(`Camión ${schedule.truckId} no encontrado`);
    }
    if (!truck.municipalityId) {
      throw new BadRequestException(
        `El camión ${schedule.truckId} no tiene municipalityId asignado`,
      );
    }

    // 3. Calcular hora de salida si no se proporciona
    let resolvedDepartedAt: Date;

    if (departedAt) {
      resolvedDepartedAt = new Date(departedAt);
    } else {
      // Construir fecha de hoy + endTime + offset
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const [endHour, endMin] = schedule.endTime.split(':').map(Number);
      const base = new Date(`${today}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`);
      const offsetMs = estimatedOffset * 60 * 1000;
      resolvedDepartedAt = new Date(base.getTime() + offsetMs);
    }

    // 4. Verificar que no exista ya un viaje para este camión en el mismo día
    const dayStart = new Date(resolvedDepartedAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(resolvedDepartedAt);
    dayEnd.setHours(23, 59, 59, 999);

    const existingTrip = await this.truckTripRepo
      .createQueryBuilder('trip')
      .where('trip.truckId = :truckId', { truckId: schedule.truckId })
      .andWhere('trip.departedAt >= :dayStart', { dayStart })
      .andWhere('trip.departedAt <= :dayEnd', { dayEnd })
      .andWhere('trip.isArchived = false')
      .getOne();

    if (existingTrip) {
      throw new ConflictException(
        `Ya existe un viaje al botadero para este camión hoy (ID: ${existingTrip.id}). ` +
        'Si necesitas registrar otro viaje, usa directamente POST /truck-trips.',
      );
    }

    // 5. Crear el TruckTrip
    const trip = this.truckTripRepo.create({
      truckId: schedule.truckId,
      disposalSiteId: disposalSiteId,
      municipalityId: truck.municipalityId,
      departedAt: resolvedDepartedAt,
    });

    return this.truckTripRepo.save(trip);
  }
}
