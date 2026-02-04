import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';

/**
 * Servicio de dispositivos.
 * Maneja creación, lectura, actualización y eliminación de dispositivos,
 * además de búsquedas opcionales por `municipalityId`.
 */
@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  /**
   * Crea un nuevo dispositivo a partir del DTO proporcionado.
   * @param dto - Datos del dispositivo a crear
   * @returns Entidad de dispositivo guardada
   */
  async create(dto: CreateDeviceDto) {
    //Verifcar si la serie ya existe en otro dispositivo
    if(dto.serie){
      const existingDevice = await this.deviceRepo.findOne({
        where: { serie: dto.serie },
        relations: ['municipality'],
      });
      if (existingDevice) throw new ConflictException('Ya existe un dispositivo con la misma serie');
    }

    const device = this.deviceRepo.create(dto);
    return this.deviceRepo.save(device);
  }

  /**
   * Busca un dispositivo por su ID.
   * @param id - ID del dispositivo
   * @throws NotFoundException si no existe
   * @returns Entidad del dispositivo
   */
  async findOne(id: string) {
    const device = await this.deviceRepo.findOne({ where: { id } });
    if (!device) throw new NotFoundException('Dispositivo no encontrado');
    return device;
  }

  /**
   * Actualiza un dispositivo existente con los datos del DTO.
   * @param id - ID del dispositivo a actualizar
   * @param dto - Datos a actualizar
   * @returns Entidad de dispositivo actualizada
   */
  async update(id: string, dto: UpdateDeviceDto) {
    const device = await this.findOne(id);
    Object.assign(device, dto);

    if (dto.municipalityId) {
      device.municipality = {id : dto.municipalityId} as any;
    }

    return this.deviceRepo.save(device);
  }

  /**
   * Archiva un dispositivo por su ID.
   * @param id - ID del dispositivo a archivar
   * @throws NotFoundException si no existe (404)
   * @returns Mensaje de confirmación
   */
  async remove(id: string) {
    const device = await this.findOne(id);
    device.isArchived = true;
    device.archivedAt = new Date();

    await this.deviceRepo.save(device);
    return { statusCode: 200, message: 'Dispositivo archivado exitosamente' };
  }
  
  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    const queryBuilder = this.deviceRepo
      .createQueryBuilder('device')
      .where('device.municipalityId = :municipalityId', { municipalityId });

    // Solo agregar el filtro isActive si se proporciona explícitamente
    if (isActive !== undefined) {
      queryBuilder.andWhere('device.isActive = :isActive', { isActive });
    }

    //Solo agregar el filtro isArchived si se proporciona explícitamente
    if (isArchived !== undefined) {
      queryBuilder.andWhere('device.isArchived = :isArchived', { isArchived });
    }else{
      queryBuilder.andWhere('device.isArchived = false'); 
    }

    // Ordenar por nombre oficial
    queryBuilder.orderBy('device.brand', 'ASC');

    return await queryBuilder.getMany();
  }

  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.deviceRepo.createQueryBuilder('device');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('device.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('device.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('device.isArchived = false');
    }

    // Ordenar por nombre
    queryBuilder.orderBy('device.brand', 'ASC');

    return await queryBuilder.getMany();
  }
}
