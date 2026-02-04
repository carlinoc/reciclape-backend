import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { RouteSchedule } from './entities/route-schedule.entity';
import { CreateRouteScheduleDto } from './dto/create-route-schedule.dto';
import { UpdateRouteScheduleDto } from './dto/update-route-schedule.dto';
import { FilterRouteSchedulesDto } from './dto/filter-route-schedules.dto';


@Injectable()
export class RouteSchedulesService {
  constructor(
    @InjectRepository(RouteSchedule)
    private readonly routeScheduleRepo: Repository<RouteSchedule>,
  ) {}

  async create(dto: CreateRouteScheduleDto): Promise<RouteSchedule> {
    const exists = await this.routeScheduleRepo.findOne({
      where: {
        truckId: dto.truckId,
        dayOfWeek: dto.dayOfWeek,
        collectionAreaId: dto.collectionAreaId ? dto.collectionAreaId : IsNull(),
      },
    });

    if (exists) {
      throw new ConflictException(
        'Ya existe una ruta para ese camión, día y área',
      );
    }

    const schedule = this.routeScheduleRepo.create(dto);
    return this.routeScheduleRepo.save(schedule);
  }

  async findByCollectionArea(collectionAreaId: string, zoneId?: string, truckId?: string) {
    const queryBuilder = this.routeScheduleRepo.createQueryBuilder('routeSchedule')
      .leftJoinAndSelect('routeSchedule.truck', 'truck')
      .leftJoinAndSelect('routeSchedule.collectionArea', 'collectionArea')
      .leftJoinAndSelect('routeSchedule.zone', 'zone')
      .where('routeSchedule.collectionAreaId = :collectionAreaId', { collectionAreaId });

    // Filtrar por zona si se proporciona
    if (zoneId !== undefined) {
      queryBuilder.andWhere('routeSchedule.zoneId = :zoneId', { zoneId });
    }

    // Filtrar por camión si se proporciona
    if (truckId !== undefined) {
      queryBuilder.andWhere('routeSchedule.truckId = :truckId', { truckId });
    }

    // Ordenar por dia de la semana
    queryBuilder.orderBy('routeSchedule.dayOfWeek', 'ASC');

    return await queryBuilder.getMany();
  }

  async findAll(zoneId?: string, truckId?: string) {
    const queryBuilder = this.routeScheduleRepo.createQueryBuilder('routeSchedule')
      .leftJoinAndSelect('routeSchedule.truck', 'truck')
      .leftJoinAndSelect('routeSchedule.collectionArea', 'collectionArea')
      .leftJoinAndSelect('routeSchedule.zone', 'zone');

    // Filtrar por zona si se proporciona
    if (zoneId !== undefined) {
      queryBuilder.andWhere('routeSchedule.zoneId = :zoneId', { zoneId });
    }

    // Filtrar por camión si se proporciona
    if (truckId !== undefined) {
      queryBuilder.andWhere('routeSchedule.truckId = :truckId', { truckId });
    }

    // Ordenar por dia de la semana
    queryBuilder.orderBy('routeSchedule.dayOfWeek', 'ASC');
    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<RouteSchedule> {
    const schedule = await this.routeScheduleRepo.findOne({
      where: { id },
      relations: ['truck', 'collectionArea'],
    });

    if (!schedule) {
      throw new NotFoundException('Ruta no encontrada');
    }

    return schedule;
  }

  async update(
    id: string,
    dto: UpdateRouteScheduleDto,
  ): Promise<RouteSchedule> {
    const schedule = await this.findOne(id);
    Object.assign(schedule, dto);

    if (dto.truckId) {
      schedule.truck = { id: dto.truckId } as any;
    }

    if (dto.collectionAreaId) {
      schedule.collectionArea = { id: dto.collectionAreaId } as any;
    }

    if (dto.zoneId) {
      schedule.zone = { id: dto.zoneId } as any;
    }

    return this.routeScheduleRepo.save(schedule);
  }

  async remove(id: string) {
    const schedule = await this.findOne(id);
    await this.routeScheduleRepo.remove(schedule);
    return { statusCode: 200, message: 'Ruta eliminada exitosamente' };
  }
}
