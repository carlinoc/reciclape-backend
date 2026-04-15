import { Controller, Post, Get, Param, Body, Request, Delete, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { QrScanCollectionDto } from './dto/qr-scan-collection.dto';
import { FilterCollectionsDto } from './dto/filter-conllections.dto';

@ApiTags('Collections')
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Post('qr-scan')
  @ApiOperation({
    summary: 'Registrar entrega de basura general via escaneo QR (App Móvil)',
    description:
      'El vecino escanea el QR del camión. Se registra automáticamente una entrega de ' +
      '"basura general" y se asignan los puntos configurados para ese tipo. ' +
      'No requiere especificar items, cantidad ni peso.',
  })
  qrScan(@Body() dto: QrScanCollectionDto) {
    return this.collectionsService.qrScan(dto);
  }

  @Post()
  @ApiOperation({ summary: 'Registrar nueva colección' })
  create(@Body() dto: CreateCollectionDto) {
    return this.collectionsService.create(dto); 
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las colecciones con filtros opcionales, usuario(vecino), truck, municipio, operador' })
  findAll( @Query() filters: FilterCollectionsDto) {
    return this.collectionsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener colección por ID' })
  findOne(@Param('id') id: string) {
    return this.collectionsService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar colección (collections, collectionItems, pointsTransactions y actualizar userPoints)'})
  @ApiResponse({
    status: 200,
    description: 'Colección eliminada exitosamente',
    schema: {
      example: {
        statusCode: 200,
        message: 'Colección eliminada exitosamente',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Colección no encontrada',
    schema: {
      example: {
        statusCode: 404,
        message: 'Colección no encontrada',
        error: 'Not Found',
      },
    },
  })
  remove(@Param('id') id: string) {
    return this.collectionsService.remove(id);
  }
}
