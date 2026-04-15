import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { ProvincesService } from './provinces.service';
import { GetProvincesDto } from './dto/get-provinces.dto';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Ubigeo')
@Controller('provinces')
export class ProvincesController {
  constructor(private readonly provincesService: ProvincesService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener provincias filtradas opcionalmente por departamento' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  @ApiQuery({ name: 'departmentId', required: false, description: 'ID del departamento (ej: 08)' })
  @ApiResponse({ status: 200, description: 'Lista de provincias' })
  async find(@Query() query: GetProvincesDto) {
    if (query.departmentId) {
      return this.provincesService.findByDepartment(query.departmentId);
    }
    return this.provincesService.findAll();
  }
}
