import { Controller, Post, Get, Body, Query, Param, Patch, Delete, UseGuards } from '@nestjs/common';
import { AdminsService } from '../services/admins.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateAdminDto } from '../dto/admins/create-admin.dto';
import { FilterAdminsDto } from '../dto/admins/filter-admins.dto';
import { UpdateAdminDto } from '../dto/admins/update-admin.dto';
import { AdminRoles } from '../../auth/decorators/admin-roles.decorator';
import { AdminRolesGuard } from '../../auth/guards/admin-roles.guard';
import { AdminRole } from '../enums/admin-role.enum';

@ApiTags('Admins')
@Controller('admins')
@UseGuards(AdminRolesGuard) // activo en todos los endpoints del controller
export class AdminsController {
  constructor(private service: AdminsService) {}

  // ── Solo SUPER_ADMIN puede crear otros admins ─────────────────────────────
  @Post()
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Crear administrador',
    description: 'Solo SUPER_ADMIN puede ejecutar este endpoint.',
  })
  create(@Body() dto: CreateAdminDto) {
    return this.service.create(dto);
  }

  // ── Ambos roles pueden listar ─────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Listar administradores con filtros' })
  findAll(@Query() filters: FilterAdminsDto) {
    return this.service.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un administrador por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // ── Ambos roles pueden actualizar ─────────────────────────────────────────
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos de un administrador' })
  update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.service.update(id, dto);
  }

  // ── Solo SUPER_ADMIN puede archivar admins ───────────────────────────────
  @Delete(':id')
  @AdminRoles(AdminRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Archivar un administrador',
    description: 'Solo SUPER_ADMIN puede ejecutar este endpoint.',
  })
  @ApiResponse({
    status: 200,
    schema: { example: { statusCode: 200, message: 'Administrador archivado exitosamente' } },
  })
  @ApiResponse({
    status: 403,
    schema: { example: { statusCode: 403, message: 'Acceso restringido. Se requiere rol: SUPER_ADMIN.' } },
  })
  @ApiResponse({
    status: 404,
    schema: { example: { statusCode: 404, message: 'Administrador no encontrado' } },
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
