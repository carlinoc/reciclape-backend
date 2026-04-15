import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionAreaType } from './entities/collection-area-type.entity';
import { CreateCollectionAreaTypeDto } from './dto/create-collection-area-type.dto';
import { UpdateCollectionAreaTypeDto } from './dto/update-collection-area-type.dto';

@Injectable()
export class CollectionAreaTypesService {
    constructor(
        @InjectRepository(CollectionAreaType)
        private readonly collectionAreaTypeRepository: Repository<CollectionAreaType>,
    ) {}

    //Crear un nuevo tipo de área de recolección
    async create(createCollectionAreaTypeDto: CreateCollectionAreaTypeDto): Promise<CollectionAreaType> {
        const newType = this.collectionAreaTypeRepository.create(createCollectionAreaTypeDto);
        return await this.collectionAreaTypeRepository.save(newType);
    }

   /**
   * Obtiene todos los tipos de áreas de recolección.
   * @param isArchived - Filtrar por estado archivado (opcional)
   * @returns Lista de todos los tipos de áreas de recolección
   */
  async findAll(isArchived?: boolean) {
    const queryBuilder = this.collectionAreaTypeRepository.createQueryBuilder('collectionAreaTypes');

    if (isArchived !== undefined) {
      queryBuilder.andWhere('collectionAreaTypes.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('collectionAreaTypes.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('collectionAreaTypes.name', 'ASC');

    return await queryBuilder.getMany();
  }

  // Obtener un tipo de área de recolección por ID
  async findOne(id: string): Promise<CollectionAreaType> {
    const item = await this.collectionAreaTypeRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tipo de área de recolección no encontrado');
    return item;
  }

  // Actualizar un tipo de área de recolección existente
  async update(id: string, updateCollectionAreaTypeDto: UpdateCollectionAreaTypeDto): Promise<CollectionAreaType> {
    const item = await this.collectionAreaTypeRepository.preload({
      id,
      ...updateCollectionAreaTypeDto,
    });
    if (!item) throw new NotFoundException('Tipo de área de recolección no encontrado');
    return await this.collectionAreaTypeRepository.save(item);
  }

  // Eliminar un tipo de área de recolección (soft delete)
  async remove(id: string) {
    const item = await this.collectionAreaTypeRepository.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tipo de área de recolección no encontrado');
    item.isArchived = true;
    await this.collectionAreaTypeRepository.save(item);

    return {statusCode: 200, message: 'Tipo de área de recolección archivado exitosamente'}; 
  }
}
