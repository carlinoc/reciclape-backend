import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from 'src/zones/entities/zones.entity';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Servicio de zonas.
 * Maneja creación, lectura, actualización y eliminación de zonas.
 */
@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepo: Repository<Zone>,
  ) { }

  /**
   * Crea una nueva zona.
   * @param dto - Datos de la zona a crear
   * @returns Zona creada
   */
  async create(dto: CreateZoneDto) {
    //Verificar que no exista una zona con el mismo nombre
    if(dto.name){
      const existingZone = await this.zoneRepo.findOne({
        where: { name: dto.name },
      });
      if (existingZone) throw new ConflictException('Ya existe una zona con el mismo nombre');
    }

    const zone = this.zoneRepo.create(dto);
    return this.zoneRepo.save(zone);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por province
    const queryBuilder = this.zoneRepo
      .createQueryBuilder('zone')
      .leftJoinAndSelect('zone.municipality', 'municipality')
      .where('municipality.id = :municipalityId', { municipalityId });

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('zone.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('zone.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('zone.isArchived = false'); 
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('zone.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene todas las zonas con filtros opcionales.
   * @param isActive - Filtrar por estado activo (opcional)
   * @returns Lista de zonas filtradas
   */
  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.zoneRepo.createQueryBuilder('zone');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('zone.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('zone.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('zone.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('zone.name', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene una zona por su ID.
   * @param id - ID de la zona
   * @throws NotFoundException si no existe
   * @returns Zona encontrada
   */
  async findOne(id: string) {
    const zone = await this.zoneRepo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Zona no encontrada');
    return zone;
  }

  /**
   * Actualiza una zona existente.
   * @param id - ID de la zona a actualizar
   * @param dto - Datos a actualizar
   * @returns Zona actualizada
   */
  async update(id: string, dto: UpdateZoneDto) {
    const zone = await this.findOne(id);
    Object.assign(zone, dto);

    if (dto.municipalityId) {
      zone.municipality = { id: dto.municipalityId } as any;
    }

    return this.zoneRepo.save(zone);
  }

  /**
   * Archiva una zona (soft delete).
   * @param id - ID de la zona a archivar
   * @throws NotFoundException si no existe (404)
   * @returns Mensaje de confirmación con statusCode 200
   */
  async remove(id: string) {
    const zone = await this.findOne(id);
    zone.isArchived = true;
    zone.archivedAt = new Date();
    await this.zoneRepo.save(zone);
    return { statusCode: 200, message: 'Zone archivado exitosamente' };
  }
}
