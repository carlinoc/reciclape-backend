import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckConvoy } from './entities/truck-convoy.entity';
import { CreateTruckConvoyDto } from './dto/create-truck-convoy.dto';
import { UpdateTruckConvoyDto } from './dto/update-truck-convoy.dto';
import { FilterTruckConvoysDto } from './dto/filter-truck-convoys.dto';

@Injectable()
export class TruckConvoysService {
  constructor(
    @InjectRepository(TruckConvoy)
    private readonly repo: Repository<TruckConvoy>,
  ) {}

  async create(dto: CreateTruckConvoyDto): Promise<TruckConvoy> {
    // Un camión no puede ser principal y de apoyo al mismo tiempo
    if (dto.mainTruckId === dto.supportTruckId) {
      throw new BadRequestException(
        'El camión principal y el de apoyo no pueden ser el mismo',
      );
    }

    // Un camión principal solo puede tener un convoy activo por día
    const existing = await this.repo.findOne({
      where: {
        date: dto.date,
        mainTruckId: dto.mainTruckId,
        isArchived: false,
      },
    });

    if (existing) {
      throw new ConflictException(
        'El camión principal ya tiene un convoy registrado para esta fecha',
      );
    }

    const convoy = this.repo.create(dto);
    return this.repo.save(convoy);
  }

  async findAll(filter: FilterTruckConvoysDto): Promise<TruckConvoy[]> {
    const qb = this.repo
      .createQueryBuilder('convoy')
      .leftJoinAndSelect('convoy.mainTruck', 'mainTruck')
      .leftJoinAndSelect('mainTruck.truckType', 'mainTruckType')
      .leftJoinAndSelect('convoy.supportTruck', 'supportTruck')
      .leftJoinAndSelect('supportTruck.truckType', 'supportTruckType')
      .leftJoinAndSelect('convoy.municipality', 'municipality');

    if (filter.date) {
      qb.andWhere('convoy.date = :date', { date: filter.date });
    }

    if (filter.mainTruckId) {
      qb.andWhere('convoy.mainTruckId = :mainTruckId', {
        mainTruckId: filter.mainTruckId,
      });
    }

    if (filter.supportTruckId) {
      qb.andWhere('convoy.supportTruckId = :supportTruckId', {
        supportTruckId: filter.supportTruckId,
      });
    }

    if (filter.role) {
      qb.andWhere('convoy.role = :role', { role: filter.role });
    }

    if (filter.municipalityId) {
      qb.andWhere('convoy.municipalityId = :municipalityId', {
        municipalityId: filter.municipalityId,
      });
    }

    qb.andWhere('convoy.isArchived = false').orderBy('convoy.date', 'DESC');

    return qb.getMany();
  }

  async findOne(id: string): Promise<TruckConvoy> {
    const convoy = await this.repo.findOne({
      where: { id },
      relations: [
        'mainTruck',
        'mainTruck.truckType',
        'supportTruck',
        'supportTruck.truckType',
        'municipality',
      ],
    });
    if (!convoy) throw new NotFoundException('Convoy no encontrado');
    return convoy;
  }

  async update(id: string, dto: UpdateTruckConvoyDto): Promise<TruckConvoy> {
    const convoy = await this.findOne(id);

    const newMainId = dto.mainTruckId ?? convoy.mainTruckId;
    const newSupportId = dto.supportTruckId ?? convoy.supportTruckId;

    if (newMainId === newSupportId) {
      throw new BadRequestException(
        'El camión principal y el de apoyo no pueden ser el mismo',
      );
    }

    Object.assign(convoy, dto);
    return this.repo.save(convoy);
  }

  async remove(id: string) {
    const convoy = await this.findOne(id);
    convoy.isArchived = true;
    convoy.archivedAt = new Date();
    await this.repo.save(convoy);
    return { statusCode: 200, message: 'Convoy archivado exitosamente' };
  }
}
