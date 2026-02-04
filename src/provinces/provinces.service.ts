import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Province } from './entities/province.entity';

/**
 * Servicio de provincias.
 * Maneja la lógica de negocio para provincias.
 */
@Injectable()
export class ProvincesService {
  constructor(
    @InjectRepository(Province)
    private readonly provinceRepo: Repository<Province>,
  ) {}

  /**
   * Obtiene todas las provincias ordenadas por nombre.
   * @returns Lista de provincias ordenada alfabéticamente
   */
  async findAll() {
    return this.provinceRepo.find({
      order: { name: 'ASC' },
    });
  }

  /**
   * Obtiene las provincias de un departamento específico.
   * @param departmentId - ID del departamento
   * @returns Lista de provincias del departamento ordenada alfabéticamente
   */
  async findByDepartment(departmentId: string) {
    return this.provinceRepo.find({
      where: { departmentId },
      order: { name: 'ASC' },
    });
  }
}
