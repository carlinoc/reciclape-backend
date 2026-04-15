import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionArea } from './entities/collection-area.entity';
import { CreateCollectionAreaDto } from './dto/create-collection-area.dto';
import { UpdateCollectionAreaDto } from './dto/update-collection-area.dto';
import { FilterCollectionAreaDto } from './dto/filter-collection-area.dto';

@Injectable()
export class CollectionAreasService {
  constructor(
    @InjectRepository(CollectionArea)
    private readonly collectionAreaRepo: Repository<CollectionArea>,
  ) {}

  async create(dto: CreateCollectionAreaDto): Promise<CollectionArea> {
    const exists = await this.collectionAreaRepo.findOne({
      where: {
        name: dto.name,
        routeScheduleId: dto.routeScheduleId,
      },
    });

    if (exists) {
      throw new ConflictException(
        'Ya existe un área con ese nombre en esta ruta',
      );
    }

    const area = this.collectionAreaRepo.create(dto);
    return this.collectionAreaRepo.save(area);
  }

  async findAll(filter: FilterCollectionAreaDto): Promise<CollectionArea[]> {
    const { routeScheduleId, areaTypeId } = filter;

    const qb = this.collectionAreaRepo
      .createQueryBuilder('ca')
      .leftJoinAndSelect('ca.routeSchedule', 'routeSchedule')
      .leftJoinAndSelect('ca.collectionAreaType', 'collectionAreaType');

    if (routeScheduleId) {
      qb.andWhere('ca.routeScheduleId = :routeScheduleId', { routeScheduleId });
    }

    if (areaTypeId) {
      qb.andWhere('ca.areaTypeId = :areaTypeId', { areaTypeId });
    }

    qb.orderBy('ca.name', 'ASC');
    return qb.getMany();
  }

  async findOne(id: string): Promise<CollectionArea> {
    const area = await this.collectionAreaRepo.findOne({
      where: { id },
      relations: ['routeSchedule', 'collectionAreaType'],
    });

    if (!area) {
      throw new NotFoundException('Área de recolección no encontrada');
    }

    return area;
  }

  async update(id: string, dto: UpdateCollectionAreaDto): Promise<CollectionArea> {
    const area = await this.findOne(id);
    Object.assign(area, dto);

    if (dto.routeScheduleId) {
      area.routeSchedule = { id: dto.routeScheduleId } as any;
    }

    if (dto.areaTypeId) {
      area.collectionAreaType = { id: dto.areaTypeId } as any;
    }

    return this.collectionAreaRepo.save(area);
  }

  async remove(id: string) {
    const area = await this.findOne(id);
    await this.collectionAreaRepo.remove(area);
    return { statusCode: 200, message: 'Área de recolección eliminada' };
  }
}
