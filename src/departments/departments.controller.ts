import { Controller, Get } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';

/**
 * Controlador de departamentos.
 * Gestiona las consultas relacionadas con departamentos (regiones).
 */
@ApiTags('Ubigeo')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  /**
   * Obtiene la lista de todos los departamentos.
   * @returns Lista completa de departamentos
   */
  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos' })
  findAll() {
    return this.departmentsService.findAll();
  }
}
