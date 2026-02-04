import * as bcrypt from 'bcrypt';
import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Address } from '../entities/address.entity';
import { CreateNeighborDto } from '../dto/neighbors/create-neighbor.dto';
import { UserType } from '../../user-type/enums/user-type.enum';
import { UpdateNeighborDto } from '../dto/neighbors/update-neighbor.dto';
import { FilterNeighborsDto } from '../dto/neighbors/filter-neighbors.dto';
import { PointsTransaction } from 'src/collections/entities/points-transaction.entity';

@Injectable()
export class NeighborsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
    @InjectRepository(PointsTransaction) private pointsTxRepo: Repository<PointsTransaction>,
  ) {}

  async create(dto: CreateNeighborDto) {
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

      // Crear instancia de Usuario
      const hashedPassword = await bcrypt.hash(dto.password, 10);
      const user = queryRunner.manager.create(User, {
        name: dto.name,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        municipalityId: dto.municipalityId,
        userType: UserType.NEIGHBOR,
        phone: dto.phone,
        dni: dto.dni,
        fcmToken: dto.fcmToken,
        device: dto.device,
      });

      // Guardar usuario para obtener el ID
      const savedUser = await queryRunner.manager.save(User, user);

      // 3. Crear instancia de Dirección vinculada al usuario
      const address = queryRunner.manager.create(Address, {
        street: dto.street,
        number: dto.number,
        apartment: dto.apartment,
        location: {
          type: 'Point',
          coordinates: [dto.longitude, dto.latitude],
        },
        zoneId: dto.zoneId,
        districtId: dto.districtId,
        userId: savedUser.id, // Vinculamos con el ID recién generado
      });

      await queryRunner.manager.save(Address, address);

      // 4. Confirmar la transacción
      await queryRunner.commitTransaction();

      // Opcional: No devolver el password en la respuesta
      const { password, ...userWithoutPassword } = savedUser;
      return userWithoutPassword;

    } catch (error) {
      // Si algo falla, se deshacen todos los inserts (User y Address)
      await queryRunner.rollbackTransaction();
      
      // Manejo de errores específicos
      if (error instanceof ConflictException) throw error;
      throw new InternalServerErrorException('No se pudo completar el registro: ' + error.message);

    } finally {
      // IMPORTANTE: Liberar el queryRunner
      await queryRunner.release();
    }
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    await this.usersRepo.update(userId, { fcmToken });
    
    return { 
      statusCode: 200, 
      message: 'Token de notificaciones actualizado correctamente' 
    };
  }

  async findAll(filters: FilterNeighborsDto) {
    const { municipalityId, zoneId, districtId, isActive, isArchived } = filters;

    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      .where('user.userType = :userType', { userType: UserType.NEIGHBOR })
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
    //Devolver el usuario con la dirección
    const user = await this.usersRepo.findOne({ 
      where: { id },
      relations: ['address'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async update(id: string, dto: UpdateNeighborDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar si el usuario existe
      const user = await queryRunner.manager.findOne(User, { where: { id } });
      if (!user) throw new NotFoundException('Vecino no encontrado');

      // 2. Separar datos para la tabla Users
      const { street, number, apartment, latitude, longitude, ...userData } = dto;

      if (Object.keys(userData).length > 0) {
        await queryRunner.manager.update(User, id, userData);
      }

      // 3. Preparar datos para la tabla Addresses
      const addressData: any = {};
      if (street) addressData.street = street;
      if (number) addressData.number = number;
      if (apartment) addressData.apartment = apartment;
      
      // Si se envían coordenadas, actualizar el objeto Point
      if (latitude !== undefined && longitude !== undefined) {
        addressData.location = {
          type: 'Point',
          coordinates: [longitude, latitude],
        };
      }

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
    return { statusCode: 200, message: 'User archivado exitosamente' };
  }

  async getPointsHistory(userId: string) {
    // 1. Verificar si el usuario existe
    const userExists = await this.usersRepo.findOne({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    // 2. Consultar transacciones
    const history = await this.pointsTxRepo.find({
      where: { userId },
      relations: [
        'collection', 
        'voucher', 
        'voucher.rewardCatalog',
      ],
      order: {
        createdAt: 'DESC', // De la más reciente a la más antigua
      },
    });

    return history;
    // 3. Formatear la respuesta (Opcional, para limpiar el JSON)
    // return history.map(tx => ({
    //   id: tx.id,
    //   type: tx.transactionType, // EARN, REDEEM, ADJUSTMENT
    //   points: tx.points,
    //   date: tx.createdAt,
    //   details: tx.transactionType === 'EARN' 
    //     ? `Recolección de residuos` 
    //     : tx.transactionType === 'REDEEM' 
    //       ? `Canje: ${tx.voucher?.rewardCatalog?.name || 'Premio'}`
    //       : 'Ajuste administrativo',
    //   voucherCode: tx.voucher?.voucherCode || null
    // }));
  }
}
