import * as bcrypt from 'bcrypt';
import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { CreateAdminDto } from '../dto/admins/create-admin.dto';
import { UserType } from '../../user-type/enums/user-type.enum';
import { Address } from '../entities/address.entity';
import { FilterAdminsDto } from '../dto/admins/filter-admins.dto';
import { UpdateAdminDto } from '../dto/admins/update-admin.dto';

@Injectable()
export class AdminsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
  ) {}

  async create(dto: CreateAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Verificiar si el DNI(documento de identidad) ya existe
      const existingDNI = await queryRunner.manager.findOne(User, { 
        where: { dni: dto.dni, municipalityId: dto.municipalityId } 
      });
      if (existingDNI) throw new Error('El DNI ya está registrado');

      // Verificar si el email ya existe
      const existingUser = await queryRunner.manager.findOne(User, { 
        where: { email: dto.email, municipalityId: dto.municipalityId } 
      });
      if (existingUser) throw new Error('El email ya está registrado');

      // 1. Crear Usuario Base
      const user = queryRunner.manager.create(User, {
        ...dto,
        password: await bcrypt.hash(dto.password, 10),
        userType: UserType.ADMIN,
      });
      const savedUser = await queryRunner.manager.save(user);

      // 2. Crear Dirección vinculada
      const address = queryRunner.manager.create(Address, {
        street: dto.street,
        number: dto.number,
        zoneId: dto.zoneId,
        districtId: dto.districtId,
        userId: savedUser.id,
      });
      await queryRunner.manager.save(address);

      await queryRunner.commitTransaction();
      return this.findOne(savedUser.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Error al crear Admin: ' + error.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: FilterAdminsDto) {
    const { municipalityId, zoneId, districtId, isActive, isArchived } = filters;

    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      .where('user.userType = :userType', { userType: UserType.ADMIN })
      .leftJoinAndSelect('user.address', 'address');

    // --- Filtros de la tabla USER ---
    if (municipalityId) {
      queryBuilder.andWhere('user.municipalityId = :municipalityId', { municipalityId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    // Lógica de archivado mejorada
    if (isArchived !== undefined) {
      queryBuilder.andWhere('user.isArchived = :isArchived', { isArchived });
    } else {
      queryBuilder.andWhere('user.isArchived = false');
    }

    // --- Filtros de la tabla ADDRESS ---
    if (zoneId) {
      queryBuilder.andWhere('address.zoneId = :zoneId', { zoneId });
    }

    if (districtId) {
      queryBuilder.andWhere('address.districtId = :districtId', { districtId });
    }

    // Orden por defecto
    queryBuilder.orderBy('user.lastName', 'ASC');

    return await queryBuilder.getMany();
  }

  async findOne(id: string) {
    const admin = await this.dataSource.getRepository(User).findOne({
      where: { id, userType: UserType.ADMIN },
      relations: ['address']
    });
    if (!admin) throw new NotFoundException('Administrador no encontrado');
    return admin;
  }

  // --- ACTUALIZAR ---
  async update(id: string, dto: UpdateAdminDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar si el usuario existe
      const user = await queryRunner.manager.findOne(User, { where: { id } });
      if (!user) throw new NotFoundException('Administrador no encontrado');

      // 2. Separar datos para la tabla Users
      const { street, number, ...userData } = dto;

      if (Object.keys(userData).length > 0) {
        await queryRunner.manager.update(User, id, userData);
      }

      // 3. Preparar datos para la tabla Addresses
      const addressData: any = {};
      if (street) addressData.street = street;
      if (number) addressData.number = number;

      // 4. Actualizar dirección (buscando por userId)
      if (Object.keys(addressData).length > 0) {
        await queryRunner.manager.update(Address, { userId: id }, addressData);
      }

      await queryRunner.commitTransaction();

      // Devolver el usuario actualizado con su dirección pero no devolver el password en la respuesta
      const userWithoutPassword = await this.findOne(id);
      return userWithoutPassword;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Error al actualizar: ' + error.message);
    } finally {
      await queryRunner.release();
    }  
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    user.isArchived = true;
    user.archivedAt = new Date();
    await this.usersRepo.save(user);
    return { statusCode: 200, message: 'Administrador archivado exitosamente' };
  }
}
