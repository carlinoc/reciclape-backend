import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { OperatorProfile } from '../entities/operator-profile.entity';
import { CreateOperatorDto } from '../dto/operators/create-operator.dto';
import { Address } from '../entities/address.entity';
import { UserType } from '../../user-type/enums/user-type.enum';
import { UpdateOperatorDto } from '../dto/operators/update-operator.dto';
import { FilterOperatorsDto } from '../dto/operators/filter-operators.dto';
import { Truck } from 'src/trucks/entities/truck.entity';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { paginate } from 'src/common/dto/pagination.dto';

@Injectable()
export class OperatorsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(OperatorProfile) private operatorRepo: Repository<OperatorProfile>,
  ) {}

  // --- CREATE ---
  async create(dto: CreateOperatorDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificiar si el DNI(documento de identidad) ya existe
      const existingDNI = await queryRunner.manager.findOne(User, { 
        where: { dni: dto.dni, municipalityId: dto.municipalityId } 
      });
      if (existingDNI) throw new ConflictException('El DNI ya está registrado');

      // Verificar si el email ya existe
      const existingUser = await queryRunner.manager.findOne(User, { 
        where: { email: dto.email, municipalityId: dto.municipalityId } 
      });
      if (existingUser) throw new ConflictException('El email ya está registrado');

      // Verificar si el camión asignado existe
      if (dto.assignedTruckId) {
        const truck = await queryRunner.manager.findOne(Truck, { 
          where: { id: dto.assignedTruckId } 
        });
        if (!truck) throw new ConflictException('El camión asignado no existe');
      }

      // Verificar asignación de camión según rol:
      // - DRIVER:    máximo 1 por camión
      // - ASSISTANT: máximo 3 por camión
      // - PROMOTER:  máximo 1 por camión
      // - MANAGER:   máximo 1 por camión
      if (dto.assignedTruckId && dto.personnelRole) {
        const existingInRole = await this.usersRepo
          .createQueryBuilder('user')
          .innerJoin('user.operatorProfile', 'profile')
          .where('user.userType = :type',                   { type: UserType.OPERATOR })
          .andWhere('user.municipalityId = :municipalityId',{ municipalityId: dto.municipalityId })
          .andWhere('user.isArchived = false')
          .andWhere('profile.assignedTruckId = :truckId',   { truckId: dto.assignedTruckId })
          .andWhere('profile.personnelRole = :role',         { role: dto.personnelRole })
          .getCount();

        const limits: Record<string, number> = {
          DRIVER:    1,
          ASSISTANT: 3,
          PROMOTER:  1,
          MANAGER:   1,
        };
        const maxAllowed = limits[dto.personnelRole] ?? 1;

        if (existingInRole >= maxAllowed) {
          const labels: Record<string, string> = {
            DRIVER:    'conductor (DRIVER)',
            ASSISTANT: 'ayudantes (ASSISTANT)',
            PROMOTER:  'promotor (PROMOTER)',
            MANAGER:   'gestor (MANAGER)',
          };
          throw new ConflictException(
            `El camión ya tiene el máximo de ${maxAllowed} ${labels[dto.personnelRole]} permitido(s).`,
          );
        }
      }

      // 1. Crear Usuario
      const user = queryRunner.manager.create(User, {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
        userType: UserType.OPERATOR,
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Crear Perfil de Operador
      const profile = queryRunner.manager.create(OperatorProfile, {
        userId: savedUser.id,
        personnelRole: dto.personnelRole,
        assignedTruckId: dto.assignedTruckId,
        isActive: dto.isActive ?? true,
      });
      await queryRunner.manager.save(profile);

      // 3. Crear Dirección (si se proporciona street)
      if (dto.street) {
        // Si no viene districtId, lo resolvemos desde la municipalidad
        let resolvedDistrictId = dto.districtId;
        if (!resolvedDistrictId) {
          const municipality = await queryRunner.manager.findOne(Municipality, {
            where: { id: dto.municipalityId },
            select: ['districtId'],
          });
          if (!municipality) throw new Error('Municipalidad no encontrada');
          resolvedDistrictId = municipality.districtId;
        }

        const address = queryRunner.manager.create(Address, {
          street:     dto.street,
          number:     dto.number    || undefined,
          zoneId:     dto.zoneId    || undefined,
          districtId: resolvedDistrictId,
          userId:     savedUser.id,
        });
        await queryRunner.manager.save(address);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedUser.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error; // Mantiene 409, 400, etc.
      }
      throw new InternalServerErrorException('Ocurrió un error al crear el operador', error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // --- READ ALL ---
  async findAll(filters: FilterOperatorsDto) {
    const { municipalityId, zoneId, districtId, isActive, isArchived, personnelRole, page = 1, limit = 20 } = filters;

    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.operatorProfile', 'profile')
      .leftJoinAndSelect('user.address', 'address')
      .leftJoinAndSelect('profile.truck', 'truck');

    queryBuilder.andWhere('user.userType = :type', { type: UserType.OPERATOR });

    if (personnelRole) {
      queryBuilder.andWhere('profile.personnelRole = :personnelRole', { personnelRole });
    }
    if (municipalityId) {
      queryBuilder.andWhere('user.municipalityId = :municipalityId', { municipalityId });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }
    if (isArchived !== undefined) {
      queryBuilder.andWhere('user.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('user.isArchived = false');
    }
    if (zoneId) {
      queryBuilder.andWhere('address.zoneId = :zoneId', { zoneId });
    }
    if (districtId) {
      queryBuilder.andWhere('address.districtId = :districtId', { districtId });
    }

    queryBuilder
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.name', 'ASC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(data, total, page, limit);
  }

  // --- READ ONE ---
  async findOne(id: string) {
    const operator = await this.dataSource.getRepository(User).findOne({
      where: { id, userType: UserType.OPERATOR },
      relations: ['operatorProfile', 'address', 'operatorProfile.truck'],
    }); 
    if (!operator) throw new NotFoundException('Operador no encontrado');
    return operator;
  }

  // --- UPDATE ---
  async update(id: string, dto: UpdateOperatorDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar existencia
      const user = await queryRunner.manager.findOne(User, { where: { id } });
      if (!user) throw new NotFoundException('Operador no encontrado');

      // 2. Destructuración de datos por tabla
      const { 
        // Campos de Address
        street, number, zoneId, districtId,
        // Campos de OperatorProfile
        personnelRole, assignedTruckId,
        // El resto son de User
        ...userData 
      } = dto;

      // 3. Actualizar tabla "users"
      if (Object.keys(userData).length > 0) {
        await queryRunner.manager.update(User, id, userData);
      }

      // 4. Validar límites por rol si cambia camión o rol
      if (assignedTruckId || personnelRole) {
        // Obtener el perfil actual para saber el estado real antes del update
        const currentProfile = await queryRunner.manager.findOne(OperatorProfile, {
          where: { userId: id },
        });

        const effectiveTruckId    = assignedTruckId  ?? currentProfile?.assignedTruckId;
        const effectiveRole       = personnelRole     ?? currentProfile?.personnelRole;
        const truckChanged        = assignedTruckId  !== undefined && assignedTruckId  !== currentProfile?.assignedTruckId;
        const roleChanged         = personnelRole     !== undefined && personnelRole     !== currentProfile?.personnelRole;

        if (effectiveTruckId && effectiveRole && (truckChanged || roleChanged)) {
          const existingInRole = await this.usersRepo
            .createQueryBuilder('user')
            .innerJoin('user.operatorProfile', 'profile')
            .where('user.id != :currentId',                { currentId: id })
            .andWhere('user.userType = :type',             { type: UserType.OPERATOR })
            .andWhere('user.municipalityId = :municipalityId', { municipalityId: user.municipalityId })
            .andWhere('user.isArchived = false')
            .andWhere('profile.assignedTruckId = :truckId',{ truckId: effectiveTruckId })
            .andWhere('profile.personnelRole = :role',     { role: effectiveRole })
            .getCount();

          const limits: Record<string, number> = {
            DRIVER:    1,
            ASSISTANT: 3,
            PROMOTER:  1,
            MANAGER:   1,
          };
          const maxAllowed = limits[effectiveRole] ?? 1;

          if (existingInRole >= maxAllowed) {
            const labels: Record<string, string> = {
              DRIVER:    'conductor (DRIVER)',
              ASSISTANT: 'ayudantes (ASSISTANT)',
              PROMOTER:  'promotor (PROMOTER)',
              MANAGER:   'gestor (MANAGER)',
            };
            throw new ConflictException(
              `El camión ya tiene el máximo de ${maxAllowed} ${labels[effectiveRole]} permitido(s).`,
            );
          }
        }
      }

      // 4b. Actualizar tabla "operatorProfiles"
      const profileData: any = {};
      if (personnelRole) profileData.personnelRole = personnelRole;
      if (assignedTruckId !== undefined) profileData.assignedTruckId = assignedTruckId;

      if (Object.keys(profileData).length > 0) {
        await queryRunner.manager.update(OperatorProfile, { userId: id }, profileData);
      }

      // 5. Actualizar tabla "addresses" (upsert)
      const clean = (v: any) => (v === '' ? null : v);
      const addressData: any = {};
      if (street !== undefined)     addressData.street     = clean(street);
      if (number !== undefined)     addressData.number     = clean(number);
      if (zoneId !== undefined)     addressData.zoneId     = clean(zoneId)     || undefined;
      if (districtId !== undefined) addressData.districtId = clean(districtId) || undefined;

      // Eliminar claves undefined para no violar FKs
      Object.keys(addressData).forEach(
        (k) => addressData[k] === undefined && delete addressData[k],
      );

      if (Object.keys(addressData).length > 0) {
        const existingAddress = await queryRunner.manager.findOne(Address, { where: { userId: id } });
        if (existingAddress) {
          await queryRunner.manager.update(Address, { userId: id }, addressData);
        } else {
          // Si no tiene districtId en el dto, resolverlo desde la municipalidad
          if (!addressData.districtId) {
            const municipality = await queryRunner.manager.findOne(Municipality, {
              where: { id: user.municipalityId },
              select: ['districtId'],
            });
            if (municipality) addressData.districtId = municipality.districtId;
          }
          const newAddress = queryRunner.manager.create(Address, { ...addressData, userId: id });
          await queryRunner.manager.save(Address, newAddress);
        }
      }

      // 6. Finalizar transacción
      await queryRunner.commitTransaction();

      // 7. Retornar el objeto completo
      return await this.findOne(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) {
        throw error; // Mantiene 409, 400, etc.
      }
      throw new InternalServerErrorException('Error al actualizar el operador: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // --- DELETE (SOFT DELETE) ---
  async remove(id: string) {
    const user = await this.dataSource.getRepository(User).findOne({
      where: { id, userType: UserType.OPERATOR }
    });
    if (!user) throw new NotFoundException('Operador no encontrado');

    user.isArchived = true;
    user.archivedAt = new Date();
    await this.dataSource.getRepository(User).save(user);

    return { statusCode: 200, message: 'Operador archivado exitosamente' };
  }
}
