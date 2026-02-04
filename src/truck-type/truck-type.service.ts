import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckType } from './entities/truck-type.entity';
import { CreateTruckTypeDto } from './dto/create-truck-type.dto';
import { UpdateTruckTypeDto } from './dto/update-truck-type.dto';

/**
 * Servicio de tipos de camiones.
 * Maneja creación, lectura, actualización y eliminación de tipos de camiones.
 */
@Injectable()
export class TruckTypeService {
  constructor(
    @InjectRepository(TruckType)
    private readonly truckTypeRepo: Repository<TruckType>,
  ) {}

  /**
   * Crea un nuevo tipo de camión.
   * @param dto - Datos del tipo de camión a crear
   * @returns Tipo de camión creado
   */
  create(dto: CreateTruckTypeDto) {
    const truckType = this.truckTypeRepo.create(dto);
    return this.truckTypeRepo.save(truckType);
  }

  /**
   * Obtiene todos los tipos de camiones.
   * @param isArchived - Filtrar por estado archivado (opcional)
   * @returns Lista de todos los tipos de camiones
   */
  async findAll(isArchived?: boolean) {
    const queryBuilder = this.truckTypeRepo.createQueryBuilder('truckType');

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('truckType.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('truckType.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('truckType.type', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene un tipo de camión por su ID.
   * @param id - ID del tipo de camión
   * @throws NotFoundException si no existe
   * @returns Tipo de camión encontrado
   */
  async findOne(id: string) {
    const item = await this.truckTypeRepo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Tipo de camión no encontrado');
    return item;
  }

  /**
   * Actualiza un tipo de camión existente.
   * @param id - ID del tipo de camión a actualizar
   * @param dto - Datos a actualizar
   * @returns Tipo de camión actualizado
   */
  async update(id: string, dto: UpdateTruckTypeDto) {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.truckTypeRepo.save(item);
  }

  /**
   * Elimina un tipo de camión.
   * @param id - ID del tipo de camión a eliminar
   * @returns Confirmación de eliminación
   */
  async remove(id: string) {
    const truckType = await this.findOne(id);
    truckType.isArchived = true;
    truckType.archivedAt = new Date();

    await this.truckTypeRepo.save(truckType);
    return { statusCode: 200, message: 'TruckType archivado exitosamente' };
  }
}
