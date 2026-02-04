import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { RouteSchedulesService } from './route-schedules.service';
import { CreateRouteScheduleDto } from './dto/create-route-schedule.dto';
import { UpdateRouteScheduleDto } from './dto/update-route-schedule.dto';
import { FilterRouteSchedulesDto } from './dto/filter-route-schedules.dto';
import { ApiTags } from '@nestjs/swagger/dist/decorators/api-use-tags.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Route Schedules')
@Controller('route-schedules')
export class RouteSchedulesController {
  constructor(
    private readonly routeSchedulesService: RouteSchedulesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una ruta' })
  create(@Body() dto: CreateRouteScheduleDto) {
    return this.routeSchedulesService.create(dto);
  }

  /**
   * GET /route-schedules?zoneId=&truckId=&dayOfWeek=
   */
  @Get()
  @ApiOperation({ summary: 'Listar todas las rutas y horas de una area de recolección' })
  findAll(@Query() query: FilterRouteSchedulesDto) {
    if (query.collectionAreaId) {
      return this.routeSchedulesService.findByCollectionArea(
        query.collectionAreaId,
        query.zoneId,
        query.truckId,
      );
    }
    
    return this.routeSchedulesService.findAll(query.zoneId, query.truckId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una ruta' })
  findOne(@Param('id') id: string) {
    return this.routeSchedulesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una ruta' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRouteScheduleDto,
  ) {
    return this.routeSchedulesService.update(id, dto);
  }
  
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una ruta' })
  @ApiResponse({
      status: 200,
      description: 'Ruta eliminada exitosamente',
      schema: {
        example: {
          statusCode: 200,
          message: 'Ruta eliminada exitosamente',
        },
      },
    })
    @ApiResponse({
      status: 404,
      description: 'Ruta no encontrada',
      schema: {
        example: {
          statusCode: 404,
          message: 'Ruta no encontrada',
          error: 'Not Found',
        },
      },
    })
  remove(@Param('id') id: string) {
    return this.routeSchedulesService.remove(id);
  }
}
