import { Controller, Get } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Ubigeo')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener todos los departamentos' })
  @ApiResponse({ status: 200, description: 'Lista de departamentos' })
  findAll() {
    return this.departmentsService.findAll();
  }
}
