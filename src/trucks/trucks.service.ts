import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './entities/truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { DataSource } from 'typeorm';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
    @InjectRepository(OperatorProfile) private operatorRepo: Repository<OperatorProfile>,
    private dataSource: DataSource, // Inyectamos DataSource
  ) {}

  async findAll(isActive?: boolean, isArchived?: boolean) {
    const queryBuilder = this.truckRepo.createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType');

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('truck.isArchived = false');
    }

    // Ordenar por createdAt
    queryBuilder.orderBy('truck.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  // Listar todos los camiones de una municipalidad
  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    const queryBuilder = this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType')  
      .leftJoinAndSelect('truck.zone', 'zone')
      .leftJoinAndSelect('truck.operatorProfiles', 'operatorProfile')
      .leftJoinAndSelect('operatorProfile.user', 'user') 
      .where('truck.municipalityId = :municipalityId', { municipalityId });

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('truck.isArchived = false');
    }

    // Ordenar por createdAt
    queryBuilder.orderBy('truck.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findByZone(zoneId: string, truckTypeId?: string, isActive?: boolean, isArchived?: boolean) {
    if (!zoneId) {
      throw new BadRequestException('El parámetro zoneId es requerido');
    }

    const queryBuilder = this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType')  
      .where('truck.zoneId = :zoneId', { zoneId });

    // Filtrar por tipo de camión si se proporciona
    if (truckTypeId) {
      queryBuilder.andWhere('truck.truckType.id = :truckTypeId', { truckTypeId });
    }

    // Filtrar por isActive si se proporciona
    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', {
        isActive
      });
    }

    // Filtrar por isArchived si se proporciona
    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', {
        isArchived
      });
    }else{
      queryBuilder.andWhere('truck.isArchived = false');
    }

    // Ordenar por createdAt
    queryBuilder.orderBy('truck.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string) {
    const truck = await this.truckRepo.findOne({
      where: { id },
      relations: ['truckType', 'zone', 'device', 'operatorProfiles', 'operatorProfiles.user'],
    });

    if (!truck) throw new NotFoundException('Camión no encontrado');
    return truck;
  }

  async create(dto: CreateTruckDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const licensePlateUpper = dto.licensePlate.trim().toUpperCase();

    try {
      // 1. Verificar conflictos de unicidad
      const conflict = await queryRunner.manager.findOne(Truck, {
        where: [
          {
            licensePlate: licensePlateUpper,
            municipalityId: dto.municipalityId,
            isArchived: false,
          },
          ...(dto.deviceId
            ? [{
                deviceId: dto.deviceId,
                municipalityId: dto.municipalityId,
                isArchived: false,
              }]
            : []),
          ...(dto.qrCode
            ? [{
                qrCode: dto.qrCode,
                municipalityId: dto.municipalityId,
                isArchived: false,
              }]
            : []),
        ],
      });

      // 2. Si existe, lanzar excepción de conflicto
      if (conflict) {
        if (conflict.licensePlate === licensePlateUpper) {
          throw new ConflictException(
            `La placa ${licensePlateUpper} ya está registrada en esta municipalidad.`,
          );
        }

        if (dto.deviceId && conflict.deviceId === dto.deviceId) {
          throw new ConflictException(
            `El dispositivo ${dto.deviceId} ya está asignado a otro camión.`,
          );
        }

        if (dto.qrCode && conflict.qrCode === dto.qrCode) {
          throw new ConflictException(
            `El código QR ${dto.qrCode} ya está en uso.`,
          );
        }
      throw new ConflictException('Ya existe un camión en conflicto con estos datos.');
      }  
      // 3. Crear y Guardar el Camión
      const { operatorId, ...truckData } = dto;
      const truck = queryRunner.manager.create(Truck, {
        ...truckData,
        licensePlate: dto.licensePlate.toUpperCase(), // Estandarizamos a mayúsculas
      });
      
      const savedTruck = await queryRunner.manager.save(Truck, truck);

      // 4. Lógica del Operador
      if (operatorId) {
        // Nota: Verifica si tu entidad usa 'id' o 'userId' como PK en OperatorProfile
        const operator = await queryRunner.manager.findOne(OperatorProfile, { 
          where: { userId: operatorId } 
        });
        
        if (!operator) throw new NotFoundException('El operador seleccionado no existe.');

        await queryRunner.manager.update(OperatorProfile, operatorId, {
          assignedTruckId: savedTruck.id
        });
      }

      await queryRunner.commitTransaction();
      return savedTruck;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error; // Re-lanzamos el error (Conflict, NotFound, etc.)
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateTruckDto) {
    const truck = await this.findOne(id);
    Object.assign(truck, dto);

    if (dto.deviceId) {
      truck.device = { id: dto.deviceId } as any;
    }

    if (dto.truckTypeId) {
      truck.truckType = { id: dto.truckTypeId } as any;
    }

    if(dto.zoneId){
      truck.zone = { id: dto.zoneId } as any;
    }

    return this.truckRepo.save(truck);    
  }

  async remove(id: string) {
    const truck = await this.findOne(id);
    truck.isArchived = true;
    truck.archivedAt = new Date();
    await this.truckRepo.save(truck);
    return { statusCode: 200, message: 'Camión archivado exitosamente' };
  }
}
