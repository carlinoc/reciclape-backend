import { Controller, Get, Post, Body, Patch, Param, Query, HttpCode } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { FilterVoucherDto } from './dto/filter-vouchers.dto';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  // ── Rutas específicas primero (antes del POST genérico de crear) ──────────

  @Patch(':id/redeem')
  @Post(':id/redeem')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar un Voucher como REDEEMED (acepta PATCH y POST)' })
  redeem(@Param('id') id: string) {
    return this.vouchersService.markAsRedeemed(id);
  }

  @Patch(':id/expire')
  @Post(':id/expire')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar un Voucher como EXPIRED (acepta PATCH y POST)' })
  expire(@Param('id') id: string) {
    return this.vouchersService.markAsExpired(id);
  }

  // ── CRUD genérico ─────────────────────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Generar un Voucher segun el catalogo de premios' })
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar vouchers con filtros: municipalityId, userId, rewardCatalogId, status, page, limit' })
  findAll(@Query() filters: FilterVoucherDto) {
    const { municipalityId, rewardCatalogId, userId, status, ...pagination } = filters as any;
    return this.vouchersService.findByMunicipality(municipalityId, pagination, rewardCatalogId, userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un voucher por ID' })
  findOne(@Param('id') id: string) {
    return this.vouchersService.findOne(id);
  }
}
