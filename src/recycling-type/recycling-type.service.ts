import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecyclingType } from './entities/recycling-type.entity';
import { CreateRecyclingTypeDto } from './dto/create-recycling-type.dto';
import { UpdateRecyclingTypeDto } from './dto/update-recycling-type.dto';
import { FilterRecyclingTypesDto } from './dto/filter-recycling-types.dto';

@Injectable()
export class RecyclingTypeService {
  constructor(
    @InjectRepository(RecyclingType)
    private readonly repo: Repository<RecyclingType>,
  ) {}

  async create(dto: CreateRecyclingTypeDto) {
    // Verifica si ya existe un tipo de reciclaje con el mismo nombre de un municipio 
    const exists = await this.repo.findOne({
      where: { name: dto.name, municipalityId: dto.municipalityId },
    });

    if (exists) {
      throw new ConflictException('El tipo de reciclaje ya existe');
    }

    const type = this.repo.create(dto);
    return this.repo.save(type);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean, isGarbage?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por province
    const queryBuilder = this.repo
      .createQueryBuilder('recyclingType')
      .where('recyclingType.municipalityId = :municipalityId', { municipalityId });

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('recyclingType.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('recyclingType.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('recyclingType.isArchived = :isArchived', { isArchived: false });
    }

    // Solo agregar el filtro isGarbage si se proporciona explícitamente
    if (isGarbage !== undefined) {
      queryBuilder.andWhere('recyclingType.isGarbage = :isGarbage', { isGarbage });
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('recyclingType.name', 'ASC');

    return await queryBuilder.getMany();
  }

  findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.repo.createQueryBuilder('recyclingType');

    if (isActive !== undefined) {
      queryBuilder.andWhere('recyclingType.isActive = :isActive', { isActive });
    }

    if (isArchived !== undefined) {
      queryBuilder.andWhere('recyclingType.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('recyclingType.isArchived = :isArchived', { isArchived: false });
    }

    queryBuilder.orderBy('recyclingType.name', 'ASC');

    return queryBuilder.getMany();
  }

  async findOne(id: string) {
    const type = await this.repo.findOne({ where: { id } });
    if (!type) throw new NotFoundException('Tipo de reciclaje no encontrado');
    return type;
  }

  async update(id: string, dto: UpdateRecyclingTypeDto) {
    const type = await this.findOne(id);

    // Verifica duplicado solo si se está actualizando el nombre
    if (dto.name) {
      const exists = await this.repo.findOne({
        where: { name: dto.name, municipalityId: type.municipalityId },
      });

      if (exists && exists.id !== id) {
        throw new ConflictException('El tipo de reciclaje ya existe');
      }
    }

    Object.assign(type, dto);
    return this.repo.save(type);
  }

  async remove(id: string) {
    const type = await this.findOne(id);
    type.isArchived = true;
    type.archivedAt = new Date();
    await this.repo.save(type);
    return { statusCode: 200, message: 'Tipo de reciclaje archivado exitosamente' };
  }
}
