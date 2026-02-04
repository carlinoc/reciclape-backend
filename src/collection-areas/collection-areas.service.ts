import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionArea } from './entities/collection-area.entity';
import { CreateCollectionAreaDto } from './dto/create-collection-area.dto';
import { UpdateCollectionAreaDto } from './dto/update-collection-area.dto';

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
        zoneId: dto.zoneId,
      },
    });

    if (exists) {
      throw new ConflictException(
        'Ya existe un área con ese nombre en la zona',
      );
    }

    const area = this.collectionAreaRepo.create(dto);
    return this.collectionAreaRepo.save(area);
  }

  async findByZoneId(
    zoneId: string,
    areaTypeId?: string,
  ): Promise<CollectionArea[]> {
    if (!zoneId) {
      throw new BadRequestException('El parámetro zoneId es requerido');
    }

    const queryBuilder = this.collectionAreaRepo
      .createQueryBuilder('collectionArea')
      .leftJoinAndSelect('collectionArea.zone', 'zone')
      .leftJoinAndSelect('collectionArea.collectionAreaType', 'collectionAreaType')
      .where('zone.id = :zoneId', { zoneId })
      .andWhere('zone.isArchived = false');

    if (areaTypeId !== undefined) {
      queryBuilder.andWhere('collectionArea.collectionAreaType.id = :areaTypeId', { areaTypeId });
    }

    // Ordenar por nombre
    queryBuilder.orderBy('collectionArea.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findAll(areaTypeId?: string): Promise<CollectionArea[]> {
    const queryBuilder = this.collectionAreaRepo.createQueryBuilder('collectionArea')
      .leftJoinAndSelect('collectionArea.zone', 'zone')
      .leftJoinAndSelect('collectionArea.collectionAreaType', 'collectionAreaType')
      .where('zone.isArchived = false');

      if (areaTypeId !== undefined) {
        queryBuilder.andWhere('collectionArea.collectionAreaType.id = :areaTypeId', { areaTypeId });
      }

    // Ordenar por nombre
    queryBuilder.orderBy('collectionArea.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<CollectionArea> {
    const area = await this.collectionAreaRepo.findOne({
      where: { id },
      relations: ['zone', 'collectionAreaType'],
    });

    if (!area) {
      throw new NotFoundException('Área de recolección no encontrada');
    }

    return area;
  }

  async update(
    id: string,
    dto: UpdateCollectionAreaDto,
  ): Promise<CollectionArea> {
    const area = await this.findOne(id);
    Object.assign(area, dto);

    if (dto.zoneId) {
      area.zone = { id: dto.zoneId } as any;
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
