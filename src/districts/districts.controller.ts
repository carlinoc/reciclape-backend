import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { GetDistrictsDto } from './dto/get-districts.dto';
import { ApiTags, ApiQuery, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Ubigeo')
@Controller('districts')
export class DistrictsController {
  constructor(private readonly districtsService: DistrictsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Obtener distritos filtrados por provincia' })
  @ApiQuery({ name: 'provinceId', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Distritos filtrados por provincia' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async getDistricts(@Query() query: GetDistrictsDto) {
    if (query.provinceId) {
      const list = await this.districtsService.findByProvince(
        query.provinceId,
        query.isActive,
      );
      return { provinceId: query.provinceId, count: list.length, districts: list };
    }
  }
}
