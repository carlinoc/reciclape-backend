import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Vouchers')
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @ApiOperation({ summary: 'Generar un Voucher segun el catalogo de premios' })
  create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos los Vouchers' })
  findAll() {
    return this.vouchersService.findAll();
  }
  
  @Patch(':id/redeem')
  @ApiOperation({ summary: 'Marcar un Voucher como REDEEMED' })
  redeem(@Param('id') id: string) {
    return this.vouchersService.markAsRedeemed(id);
  }

  @Patch(':id/expire')
  @ApiOperation({ summary: 'Marcar un Voucher como EXPIRED' })
  expire(@Param('id') id: string) {
    return this.vouchersService.markAsExpired(id);
  }
}
