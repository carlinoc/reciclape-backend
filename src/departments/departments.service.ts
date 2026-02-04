import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';

/**
 * Servicio de departamentos.
 * Maneja la lógica de negocio para departamentos.
 */
@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) {}

  /**
   * Obtiene todos los departamentos ordenados por nombre.
   * @returns Lista de departamentos ordenada alfabéticamente
   */
  async findAll() {
    return this.departmentRepo.find({
      order: { name: 'ASC' },
    });
  }
}
