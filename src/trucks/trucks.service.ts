import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Truck } from './entities/truck.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { DataSource } from 'typeorm';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';
import { RouteSchedule } from 'src/route-schedules/entities/route-schedule.entity';
import { paginate } from 'src/common/dto/pagination.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Truck) private truckRepo: Repository<Truck>,
    @InjectRepository(OperatorProfile) private operatorRepo: Repository<OperatorProfile>,
    private dataSource: DataSource, // Inyectamos DataSource
  ) {}

  // ── Helper: enrich trucks with their zones from routeSchedules ──────────────
  private async enrichWithZones(trucks: any[], dataSource: DataSource): Promise<any[]> {
    if (!trucks.length) return trucks;
    const truckIds = trucks.map(t => t.id);
    const schedules = await dataSource
      .getRepository(RouteSchedule)
      .createQueryBuilder('rs')
      .leftJoinAndSelect('rs.zone', 'zone')
      .where('rs.truckId IN (:...truckIds)', { truckIds })
      .andWhere('rs.isArchived = false')
      .andWhere('rs.isActive = true')
      .getMany();

    // Group unique zones per truck
    const zonesByTruck = new Map<string, any[]>();
    for (const rs of schedules) {
      if (!rs.zone) continue;
      const list = zonesByTruck.get(rs.truckId) ?? [];
      if (!list.find(z => z.id === rs.zone.id)) list.push(rs.zone);
      zonesByTruck.set(rs.truckId, list);
    }
    return trucks.map(t => ({ ...t, zones: zonesByTruck.get(t.id) ?? [] }));
  }

  async findAll(isActive?: boolean, isArchived?: boolean, page = 1, limit = 20) {
    const queryBuilder = this.truckRepo.createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType');

    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', { isActive });
    }

    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('truck.isArchived = false');
    }

    queryBuilder.orderBy('truck.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const enriched = await this.enrichWithZones(data, this.dataSource);
    return paginate(enriched, total, page, limit);
  }

  async findByMunicipality(municipalityId: string, isActive?: boolean, isArchived?: boolean, page = 1, limit = 20) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    const queryBuilder = this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType')
      .leftJoinAndSelect('truck.operatorProfiles', 'operatorProfile')
      .leftJoinAndSelect('operatorProfile.user', 'user')
      .where('truck.municipalityId = :municipalityId', { municipalityId });

    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', { isActive });
    }

    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('truck.isArchived = false');
    }

    queryBuilder.orderBy('truck.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const enriched = await this.enrichWithZones(data, this.dataSource);
    return paginate(enriched, total, page, limit);
  }

  async findByZone(zoneId: string, truckTypeId?: string, isActive?: boolean, isArchived?: boolean, page = 1, limit = 20) {
    if (!zoneId) {
      throw new BadRequestException('El parámetro zoneId es requerido');
    }

    // Los camiones ya no tienen zoneId — se buscan via routeSchedules activos
    const queryBuilder = this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.truckType', 'truckType')
      .leftJoinAndSelect('truck.operatorProfiles', 'operatorProfile')
      .leftJoinAndSelect('operatorProfile.user', 'user')
      .innerJoin(
        RouteSchedule, 'rs',
        'rs.truckId = truck.id AND rs.zoneId = :zoneId AND rs.isArchived = false AND rs.isActive = true',
        { zoneId },
      )
      .distinct(true);

    if (truckTypeId) {
      queryBuilder.andWhere('truck.truckTypeId = :truckTypeId', { truckTypeId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('truck.isActive = :isActive', { isActive });
    }

    if (isArchived !== undefined) {
      queryBuilder.andWhere('truck.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('truck.isArchived = false');
    }

    queryBuilder.orderBy('truck.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const enriched = await this.enrichWithZones(data, this.dataSource);
    return paginate(enriched, total, page, limit);
  }

  async findOne(id: string) {
    const truck = await this.truckRepo.findOne({
      where: { id },
      relations: ['truckType', 'device', 'operatorProfiles', 'operatorProfiles.user'],
    });

    if (!truck) throw new NotFoundException('Camión no encontrado');
    const [enriched] = await this.enrichWithZones([truck], this.dataSource);
    return enriched;
  }

  async create(dto: CreateTruckDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // licensePlate es opcional (ej: volquetes PENDING_PLATE aún sin placa)
    const licensePlateUpper = dto.licensePlate
      ? dto.licensePlate.trim().toUpperCase()
      : null;

    try {
      // 1. Verificar conflictos de unicidad solo si hay placa
      const conflictConditions = [
        ...(licensePlateUpper
          ? [{ licensePlate: licensePlateUpper, municipalityId: dto.municipalityId, isArchived: false }]
          : []),
        ...(dto.deviceId
          ? [{ deviceId: dto.deviceId, municipalityId: dto.municipalityId, isArchived: false }]
          : []),
        ...(dto.qrCode
          ? [{ qrCode: dto.qrCode, municipalityId: dto.municipalityId, isArchived: false }]
          : []),
      ];

      if (conflictConditions.length > 0) {
        const conflict = await queryRunner.manager.findOne(Truck, {
          where: conflictConditions,
        });

        if (conflict) {
          if (licensePlateUpper && conflict.licensePlate === licensePlateUpper) {
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
      }

      // 2. Crear y guardar el camión
      // Sanear campos opcionales: vacío → null/undefined para no violar constraints UNIQUE
      const { operatorId, ...truckData } = dto;
      const truckPayload = {
        ...truckData,
        licensePlate: licensePlateUpper || undefined,
        deviceId:     (truckData.deviceId  || undefined) as string | undefined,
        qrCode:       (truckData.qrCode?.trim() || undefined) as string | undefined,
      };
      const truck = queryRunner.manager.create(Truck, truckPayload);

      let savedTruck: Truck;
      try {
        savedTruck = await queryRunner.manager.save(Truck, truck);
      } catch (saveError) {
        if (saveError?.code === '23505') {
          const detail: string = saveError?.detail ?? '';
          if (detail.includes('licensePlate'))
            throw new ConflictException(`La placa ${licensePlateUpper} ya está registrada en esta municipalidad.`);
          if (detail.includes('qrCode'))
            throw new ConflictException('El código QR ya está en uso por otro camión.');
          if (detail.includes('deviceId'))
            throw new ConflictException('El dispositivo GPS ya está asignado a otro camión.');
          throw new ConflictException('Conflicto de datos únicos al crear el camión.');
        }
        throw new InternalServerErrorException('Error al guardar el camión. Verifica los datos e intenta de nuevo.');
      }

      // 3. Lógica del Operador
      if (operatorId) {
        const operator = await queryRunner.manager.findOne(OperatorProfile, {
          where: { userId: operatorId },
        });

        if (!operator) throw new NotFoundException('El operador seleccionado no existe.');

        await queryRunner.manager.update(OperatorProfile, operatorId, {
          assignedTruckId: savedTruck.id,
        });
      }

      await queryRunner.commitTransaction();
      return savedTruck;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async update(id: string, dto: UpdateTruckDto) {
    // Verificar que el camión existe
    await this.findOne(id);

    const { operatorId, deviceId, truckTypeId, qrCode, licensePlate, ...rest } = dto as any;

    // Construir objeto de actualización con solo los campos enviados
    const payload: Record<string, any> = { ...rest };

    if (licensePlate !== undefined) {
      payload.licensePlate = licensePlate?.trim()
        ? licensePlate.trim().toUpperCase()
        : null;
    }

    if (qrCode !== undefined) {
      payload.qrCode = qrCode?.trim() || null;
    }

    // deviceId y truckTypeId van como FK directas
    if (deviceId !== undefined) payload.deviceId    = deviceId  || null;
    if (truckTypeId)             payload.truckTypeId = truckTypeId;

    // Persistir todo de una sola vez con update() que respeta null
    try {
      await this.truckRepo.update(id, payload);
    } catch (error) {
      if (error?.code === '23505') {
        const detail: string = error?.detail ?? '';
        if (detail.includes('licensePlate'))
          throw new ConflictException(`La placa ${payload.licensePlate} ya está registrada en esta municipalidad.`);
        if (detail.includes('qrCode'))
          throw new ConflictException('El código QR ya está en uso por otro camión.');
        if (detail.includes('deviceId'))
          throw new ConflictException('El dispositivo ya está asignado a otro camión.');
        throw new ConflictException('Conflicto de datos únicos al actualizar el camión.');
      }
      throw new InternalServerErrorException('Error al actualizar el camión. Verifica los datos e intenta de nuevo.');
    }

    // operatorId: gestionar aparte ya que es tabla diferente
    if (operatorId !== undefined) {
      if (operatorId) {
        const operator = await this.operatorRepo.findOne({ where: { userId: operatorId } });
        if (!operator) throw new NotFoundException('El operador seleccionado no existe.');
        await this.operatorRepo.update({ userId: operatorId }, { assignedTruckId: id });
      } else {
        await this.operatorRepo
          .createQueryBuilder()
          .update()
          .set({ assignedTruckId: () => 'NULL' })
          .where('assignedTruckId = :id', { id })
          .execute();
      }
    }

    // Devolver el camión actualizado con relaciones
    return this.findOne(id);
  }

  async remove(id: string) {
    const truck = await this.findOne(id);
    truck.isArchived = true;
    truck.archivedAt = new Date();
    await this.truckRepo.save(truck);
    return { statusCode: 200, message: 'Camión archivado exitosamente' };
  }
}
