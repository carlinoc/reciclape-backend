import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { GetDistrictsDto } from './dto/get-districts.dto';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';

/**
 * Controlador de distritos.
 * Gestiona las consultas relacionadas con distritos.
 */
@ApiTags('Ubigeo')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  /**
   * Obtiene los distritos filtrados por provincia.
   * @param query - DTO con el ID de la provincia
   * @returns Lista de distritos con contador
   */
  @Get()
  @ApiOperation({ summary: 'Obtener distritos filtrados por provincia' })
  @ApiQuery({ name: 'provinceId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Distritos filtrados por provincia' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getDistricts(@Query() query: GetDistrictsDto) {
    if (query.provinceId) {
      // **Pasamos provinceId y el opcional isActive**
      const list = await this.districtsService.findByProvince(
        query.provinceId,
        query.isActive,
      );

      return {
        provinceId: query.provinceId,
        count: list.length,
        districts: list,
      };
    }
  }
}
