import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Municipality } from './entities/municipality.entity';
import { CreateMunicipalityDto } from './dto/create-municipality.dto';
import { UpdateMunicipalityDto } from './dto/update-municipality.dto';

/**
 * Servicio de municipios.
 * Maneja creación, lectura, actualización y eliminación de municipios.
 */
@Injectable()
export class MunicipalitiesService {
  constructor(
    @InjectRepository(Municipality)
    private repository: Repository<Municipality>,
  ) {}

  /**
   * Crea un nuevo municipio.
   * @param dto - Datos del municipio a crear
   * @returns Municipio creado
   */
  create(dto: CreateMunicipalityDto) {
    const municipality = this.repository.create(dto);
    return this.repository.save(municipality);
  }

  /**
   * Obtiene todas las municipalidades con filtro opcional de estado.
   * @param isActive - (Opcional) Filtrar por estado activo/inactivo
   * @returns Lista de todas las municipalidades ordenadas alfabéticamente
   */
  async findAll(isActive?: boolean) {
    const queryBuilder = this.repository
      .createQueryBuilder('municipality')
      .leftJoinAndSelect('municipality.district', 'district');

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.where('municipality.isActive = :isActive', { isActive });
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('municipality.officialName', 'ASC');

    return await queryBuilder.getMany();
  }

  /**
   * Obtiene municipios de una provincia con filtro opcional de estado.
   * @param provinceId - ID de la provincia (requerido)
   * @param isActive - (Opcional) Filtrar por estado activo/inactivo
   * @returns Lista de municipios ordenada alfabéticamente por nombre oficial
   */
  async findByProvince(provinceId: string, isActive?: boolean, isArchived?: boolean) {
    if (!provinceId) {
      throw new BadRequestException('El parámetro provinceId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por provincia
    const queryBuilder = this.repository
      .createQueryBuilder('municipality')
      .leftJoinAndSelect('municipality.district', 'district')
      .where('district.provinceId = :provinceId', { provinceId });
      
    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('municipality.isActive = :isActive', { isActive });
    }

    // Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('municipality.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('municipality.isArchived = false');
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('municipality.officialName', 'ASC');
    
    return await queryBuilder.getMany();
  }

  async findOneByDistrict(districtId: string) {
    if (!districtId) throw new BadRequestException('El parámetro districtId es requerido');

    const municipality = await this.repository
      .createQueryBuilder('municipality')
      .leftJoinAndSelect('municipality.district', 'district')
      .where('district.id = :districtId', { districtId })
      .andWhere('municipality.isArchived = false')
      .andWhere('municipality.isActive = true')
      .getOne();

    if (!municipality) throw new NotFoundException(`No se encontró municipio para el distrito ${districtId}`);
    return municipality;
  }

  async findByDistrict(districtId: string, isActive?: boolean, isArchived?: boolean) {
    if (!districtId) {
      throw new BadRequestException('El parámetro districtId es requerido');
    }

    // Query builder para hacer JOIN con districts y filtrar por distrito
    const queryBuilder = this.repository
      .createQueryBuilder('municipality')
      .leftJoinAndSelect('municipality.district', 'district')
      .where('district.id = :districtId', { districtId });
      
    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('municipality.isActive = :isActive', { isActive });
    }

    // Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('municipality.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('municipality.isArchived = false');
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('municipality.officialName', 'ASC');
    
    return await queryBuilder.getMany();
  }

  /**
   * Obtiene un municipio por su ID con su distrito asociado.
   * @param id - ID del municipio
   * @throws NotFoundException si no existe
   * @returns Municipio encontrado
   */
  async findOne(id: string) {
    const municipality = await this.repository.findOne({
      where: { id },
      relations: ['district'],
    });

    if (!municipality) throw new NotFoundException('Municipio no encontrado');
    return municipality;
  }

  /**
   * Actualiza un municipio existente.
   * @param id - ID del municipio a actualizar
   * @param dto - Datos a actualizar
   * @throws NotFoundException si no existe
   * @returns Municipio actualizado
   */
  async update(id: string, dto: UpdateMunicipalityDto) {
    const municipality = await this.repository.findOne({ where: { id } });

    if (!municipality) {
      throw new NotFoundException('Municipio no encontrado');
    }

    Object.assign(municipality, dto);

    return await this.repository.save(municipality);
  }

  /**
   * Archiva un municipio (soft delete).
   * @param id - ID del municipio a archivar
   * @throws NotFoundException si el municipio no existe (404)
   * @returns Mensaje de confirmación con statusCode 200
   */
  async remove(id: string) {
    const municipality = await this.findOne(id);
    municipality.isArchived = true;
    municipality.archivedAt = new Date();
    await this.repository.save(municipality);
    return { statusCode: 200, message: 'Municipio archivado exitosamente' };
  }
}
