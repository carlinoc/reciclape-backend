import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckTrip } from './entities/truck-trip.entity';
import { CreateTruckTripDto } from './dto/create-truck-trip.dto';
import { UpdateTruckTripDto } from './dto/update-truck-trip.dto';
import { FilterTruckTripsDto } from './dto/filter-truck-trips.dto';

@Injectable()
export class TruckTripsService {
  constructor(
    @InjectRepository(TruckTrip)
    private readonly repo: Repository<TruckTrip>,
  ) {}

  async create(dto: CreateTruckTripDto): Promise<TruckTrip> {
    const trip = this.repo.create(dto);
    return this.repo.save(trip);
  }

  async findAll(filter: FilterTruckTripsDto): Promise<TruckTrip[]> {
    const qb = this.repo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('truck.truckType', 'truckType')
      .leftJoinAndSelect('trip.disposalSite', 'disposalSite')
      .leftJoinAndSelect('trip.municipality', 'municipality');

    if (filter.truckId) {
      qb.andWhere('trip.truckId = :truckId', { truckId: filter.truckId });
    }

    if (filter.disposalSiteId) {
      qb.andWhere('trip.disposalSiteId = :disposalSiteId', {
        disposalSiteId: filter.disposalSiteId,
      });
    }

    if (filter.municipalityId) {
      qb.andWhere('trip.municipalityId = :municipalityId', {
        municipalityId: filter.municipalityId,
      });
    }

    if (filter.dateFrom) {
      qb.andWhere('trip.departedAt >= :dateFrom', {
        dateFrom: filter.dateFrom,
      });
    }

    if (filter.dateTo) {
      qb.andWhere('trip.departedAt <= :dateTo', {
        dateTo: `${filter.dateTo}T23:59:59Z`,
      });
    }

    qb.andWhere('trip.isArchived = false').orderBy('trip.departedAt', 'DESC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<TruckTrip> {
    const trip = await this.repo.findOne({
      where: { id },
      relations: ['truck', 'truck.truckType', 'disposalSite', 'municipality'],
    });
    if (!trip) throw new NotFoundException('Viaje al botadero no encontrado');
    return trip;
  }

  // Permite actualizar el viaje en pasos: llegada → descarga → retorno
  async update(id: string, dto: UpdateTruckTripDto): Promise<TruckTrip> {
    const trip = await this.findOne(id);
    Object.assign(trip, dto);
    return this.repo.save(trip);
  }

  async remove(id: string) {
    const trip = await this.findOne(id);
    trip.isArchived = true;
    trip.archivedAt = new Date();
    await this.repo.save(trip);
    return { statusCode: 200, message: 'Viaje archivado exitosamente' };
  }
}
