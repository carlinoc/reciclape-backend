import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RewardCatalog } from './entities/reward-catalog.entity';
import { CreateRewardCatalogDto } from './dto/create-reward-catalog.dto';
import { UpdateRewardCatalogDto } from './dto/update-reward-catalog.dto';
import { FilterRewardCatalogsDto } from './dto/filter-reward-catalogs.dto';

@Injectable()
export class RewardsCatalogService {
  constructor(
    @InjectRepository(RewardCatalog)
    private readonly repo: Repository<RewardCatalog>,
  ) {}

  async create(dto: CreateRewardCatalogDto) {
    if (dto.startDate && dto.endDate && dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor a la fecha de fin',
      );
    }

    const reward = this.repo.create(dto);
    return this.repo.save(reward);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por province
    const queryBuilder = this.repo
      .createQueryBuilder('reward')
      .where('reward.municipalityId = :municipalityId', { municipalityId });

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('reward.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('reward.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('reward.isArchived = false'); 
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('reward.name', 'ASC');

    return await queryBuilder.getMany();
  }

  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.repo.createQueryBuilder('reward');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('reward.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('reward.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('reward.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('reward.name', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string) {
    const reward = await this.repo.findOne({ where: { id } });
    if (!reward) throw new NotFoundException('Recompensa no encontrada');
    return reward;
  }

  async update(id: string, dto: UpdateRewardCatalogDto) {
    const reward = await this.findOne(id);

    if (dto.startDate && dto.endDate && dto.startDate > dto.endDate) {
      throw new BadRequestException(
        'La fecha de inicio no puede ser mayor a la fecha de fin',
      );
    }

    Object.assign(reward, dto);
    return this.repo.save(reward);
  }

  async remove(id: string) {
    const reward = await this.findOne(id);
    reward.isArchived = true;
    reward.archivedAt = new Date();
    await this.repo.save(reward);
    return { statusCode: 200, message: 'Recompensa archivada exitosamente' };
  }
}
