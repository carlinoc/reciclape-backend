import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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

      // Verificar si el camión ya esta asignado a otro operador de la misma municipalidad
      if (dto.assignedTruckId) {
        const queryBuilder = this.usersRepo
          .createQueryBuilder('user')
          .innerJoinAndSelect('user.operatorProfile', 'profile')
          .where('user.userType = :type', { type: UserType.OPERATOR })
          .andWhere('user.municipalityId = :municipalityId', { municipalityId: dto.municipalityId })
          .andWhere('profile.assignedTruckId = :assignedTruckId', { assignedTruckId: dto.assignedTruckId });

        const operatorWithTruck = await queryBuilder.getOne();
        if (operatorWithTruck) {
          throw new ConflictException('El camión ya está asignado a otro operador de la misma municipalidad');
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

      // 3. Crear Dirección (si se proporciona)
      if (dto.street) {
        const address = queryRunner.manager.create(Address, {
          ...dto,
          userId: savedUser.id,
        });
        await queryRunner.manager.save(address);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedUser.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(error.message);
    } finally {
      await queryRunner.release();
    }
  }

  // --- READ ALL ---
  async findAll(filters: FilterOperatorsDto) {
    const { municipalityId, zoneId, districtId, isActive, isArchived, personnelRole } = filters;

    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      // Unimos el perfil de operador (Obligatorio para ser operador)
      .innerJoinAndSelect('user.operatorProfile', 'profile') 
      // Unimos la dirección (Opcional, pero necesaria para filtrar por zona/distrito)
      .leftJoinAndSelect('user.address', 'address')
      // Unimos el camión para que el listado sea útil en el frontend
      .leftJoinAndSelect('profile.truck', 'truck');

    // Filtro base: Solo usuarios de tipo OPERADOR
    queryBuilder.andWhere('user.userType = :type', { type: UserType.OPERATOR });

    // Filtro personnelRole
    if (personnelRole) {
      queryBuilder.andWhere('profile.personnelRole = :personnelRole', { personnelRole });
    }

    // --- Filtros Dinámicos ---

    if (municipalityId) {
      queryBuilder.andWhere('user.municipalityId = :municipalityId', { municipalityId });
    }

    if (isActive !== undefined) {
      // Aquí puedes decidir si filtrar por isActive del usuario o del perfil
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Manejo de archivados (por defecto false)
    if (isArchived !== undefined) {
      queryBuilder.andWhere('user.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('user.isArchived = false');
    }

    // --- Filtros de Dirección (Tabla addresses) ---
    if (zoneId) {
      queryBuilder.andWhere('address.zoneId = :zoneId', { zoneId });
    }

    if (districtId) {
      queryBuilder.andWhere('address.districtId = :districtId', { districtId });
    }

    // Ordenar por apellido y nombre
    queryBuilder
      .orderBy('user.lastName', 'ASC')
      .addOrderBy('user.name', 'ASC');

    return await queryBuilder.getMany();
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

      // 4. Actualizar tabla "operatorProfiles"
      const profileData: any = {};
      if (personnelRole) profileData.personnelRole = personnelRole;
      if (assignedTruckId !== undefined) profileData.assignedTruckId = assignedTruckId;

      if (Object.keys(profileData).length > 0) {
        await queryRunner.manager.update(OperatorProfile, { userId: id }, profileData);
      }

      // 5. Actualizar tabla "addresses"
      const addressData: any = {};
      if (street) addressData.street = street;
      if (number) addressData.number = number;
      if (zoneId) addressData.zoneId = zoneId;
      if (districtId) addressData.districtId = districtId;

      if (Object.keys(addressData).length > 0) {
        // Usamos userId porque en addresses la relación es 1:1 o Many:1 con el usuario
        await queryRunner.manager.update(Address, { userId: id }, addressData);
      }

      // 6. Finalizar transacción
      await queryRunner.commitTransaction();

      // 7. Retornar el objeto completo
      return await this.findOne(id);

    } catch (error) {
      await queryRunner.rollbackTransaction();
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
