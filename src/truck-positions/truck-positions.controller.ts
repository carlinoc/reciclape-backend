import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common';
import { TruckPositionsService } from './truck-positions.service';
import { CreateTruckPositionDto } from './dto/create-truck-position.dto';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';

@ApiTags('Truck Positions')
@Controller('truck-positions')
export class TruckPositionsController {
  constructor(private readonly service: TruckPositionsService) {}

  @Post()
  create(@Body() dto: CreateTruckPositionDto) {
    return this.service.create(dto);
  }

  @Get('latest')
  latest() {
    return this.service.getLatestPositions();
  }
}
