import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { District } from './entities/district.entity';

/**
 * Servicio de distritos.
 * Maneja la lógica de negocio para distritos.
 */
@Injectable()
export class DistrictsService {
  constructor(
    @InjectRepository(District)
    private readonly districtRepo: Repository<District>,
  ) {}

  /**
   * Obtiene los distritos de una provincia específica ordenados por nombre.
   * @param provinceId - ID de la provincia
   * @param isActive - (Opcional) Filtrar por estado activo/inactivo
   * @returns Lista de distritos ordenada alfabéticamente
   */
  async findByProvince(provinceId: string , isActive?: boolean): Promise<District[]> {
    // 1. Inicializamos la condición WHERE con el campo obligatorio (provinceId)
    const whereCondition: FindOptionsWhere<District> = {
      provinceId: provinceId,
    };

    // 2. Condición dinámica: Solo si 'isActive' está definido, lo añadimos al WHERE
    if (isActive !== undefined) {
      whereCondition.isActive = isActive;
    }
    
    // 3. Ejecutamos la consulta con la condición WHERE construida
    return this.districtRepo.find({
      where: whereCondition,
      order: {
        name: 'ASC',
      },
    });
  }
}
