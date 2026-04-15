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
import { Collection } from 'src/collections/entities/collection.entity';
import { UserPoint } from 'src/user-points/entities/user-point.entity';
import { PaginationDto, paginate } from 'src/common/dto/pagination.dto';

@Injectable()
export class NeighborsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
    @InjectRepository(PointsTransaction) private pointsTxRepo: Repository<PointsTransaction>,
    @InjectRepository(UserPoint) private userPointsRepo: Repository<UserPoint>,
    @InjectRepository(Collection) private collectionRepo: Repository<Collection>,
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
        notifyBefore: dto.notifyBefore ?? 5,
        activateNotification: dto.activateNotification ?? true,
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
    const { municipalityId, zoneId, districtId, isActive, isArchived, page = 1, limit = 20 } = filters;

    const queryBuilder = this.usersRepo
      .createQueryBuilder('user')
      .where('user.userType = :userType', { userType: UserType.NEIGHBOR })
      .leftJoinAndSelect('user.address', 'address');

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

    queryBuilder.orderBy('user.lastName', 'ASC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(data, total, page, limit);
  }

  async searchByDniOrLastName(municipalityId: string, q: string) {
    const term = q.trim();
    if (!term) return [];

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.address', 'address')
      .where('user.userType = :userType', { userType: UserType.NEIGHBOR })
      .andWhere('user.municipalityId = :municipalityId', { municipalityId })
      .andWhere('user.isArchived = false');

    // Si el término solo contiene dígitos → buscar por DNI exacto
    // Si no → buscar por apellido con ILIKE (insensible a mayúsculas/tildes)
    if (/^\d+$/.test(term)) {
      qb.andWhere('user.dni = :dni', { dni: term });
    } else {
      qb.andWhere('user.lastName ILIKE :lastName', { lastName: `%${term}%` });
    }

    qb.orderBy('user.lastName', 'ASC').addOrderBy('user.name', 'ASC');

    const users = await qb.take(20).getMany();
    if (users.length === 0) return [];

    // Obtener puntos de todos los usuarios en una sola consulta
    const userIds = users.map((u) => u.id);
    const pointsMap = new Map<string, { balancePoints: number; lastUpdatedAt: Date }>();

    const pointsRows = await this.userPointsRepo
      .createQueryBuilder('up')
      .select(['up.userId', 'up.balancePoints', 'up.lastUpdatedAt'])
      .where('up.userId IN (:...userIds)', { userIds })
      .getMany();

    for (const row of pointsRows) {
      pointsMap.set(row.userId, {
        balancePoints: row.balancePoints,
        lastUpdatedAt: row.lastUpdatedAt,
      });
    }

    return users.map(({ password, ...u }) => ({
      ...u,
      points: pointsMap.get(u.id) ?? { balancePoints: 0, lastUpdatedAt: null },
    }));
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

  async updateNotificationSettings(userId: string, dto: { notifyBefore?: number; activateNotification?: boolean }) {
    const address = await this.addressRepo.findOne({ where: { userId } });
    if (!address) throw new NotFoundException('Dirección del vecino no encontrada');

    const payload: any = {};
    if (dto.notifyBefore !== undefined)        payload.notifyBefore        = dto.notifyBefore;
    if (dto.activateNotification !== undefined) payload.activateNotification = dto.activateNotification;

    if (Object.keys(payload).length === 0) {
      return { message: 'No se enviaron campos para actualizar', address };
    }

    await this.addressRepo.update({ userId }, payload);

    const updated = await this.addressRepo.findOne({ where: { userId } });
    return {
      message: 'Configuración de notificaciones actualizada',
      notifyBefore:        updated?.notifyBefore,
      activateNotification: updated?.activateNotification,
    };
  }

  async update(id: string, dto: UpdateNeighborDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Verificar si el usuario existe
      const user = await queryRunner.manager.findOne(User, { where: { id } });
      if (!user) throw new NotFoundException('Vecino no encontrado');

      // 2. Separar campos de Address vs campos de User
      // zoneId y districtId pertenecen a la tabla addresses, NO a users
      const {
        street, number, apartment,
        latitude, longitude,
        notifyBefore, activateNotification,
        zoneId, districtId,
        ...userData
      } = dto as any;

      // Convertir strings vacíos a null en userData (fcmToken, device, etc.)
      const cleanUserData = Object.fromEntries(
        Object.entries(userData).map(([k, v]) => [k, v === '' ? null : v]),
      );

      if (Object.keys(cleanUserData).length > 0) {
        await queryRunner.manager.update(User, id, cleanUserData);
      }

      // 3. Preparar datos para la tabla Addresses
      // Los strings vacíos ("") se tratan como null para no violar FKs
      const clean = (v: any) => (v === '' ? null : v);

      const addressData: any = {};
      if (street !== undefined)       addressData.street       = clean(street);
      if (number !== undefined)       addressData.number       = clean(number);
      if (apartment !== undefined)    addressData.apartment    = clean(apartment);
      if (notifyBefore !== undefined)          addressData.notifyBefore          = notifyBefore;
      if (activateNotification !== undefined)   addressData.activateNotification  = activateNotification;
      if (zoneId !== undefined)       addressData.zoneId       = clean(zoneId)     || undefined;
      if (districtId !== undefined)   addressData.districtId   = clean(districtId) || undefined;

      // Eliminar claves que quedaron undefined (FK no puede ser string vacío ni undefined)
      Object.keys(addressData).forEach(
        (k) => addressData[k] === undefined && delete addressData[k],
      );

      // Si se envían coordenadas válidas, actualizar el objeto Point
      if (latitude !== undefined && longitude !== undefined &&
          latitude !== null && longitude !== null) {
        addressData.location = {
          type: 'Point',
          coordinates: [longitude, latitude],
        };
      }

      // 4. Upsert dirección: actualizar si existe, crear si no existe
      if (Object.keys(addressData).length > 0) {
        const existingAddress = await queryRunner.manager.findOne(Address, {
          where: { userId: id },
        });

        if (existingAddress) {
          await queryRunner.manager.update(Address, { userId: id }, addressData);
        } else {
          const newAddress = queryRunner.manager.create(Address, {
            ...addressData,
            userId: id,
          });
          await queryRunner.manager.save(Address, newAddress);
        }
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

  async getPointsHistory(userId: string, pagination: PaginationDto) {
    const userExists = await this.usersRepo.findOne({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    const { page = 1, limit = 20 } = pagination;

    const [data, total] = await this.pointsTxRepo.findAndCount({
      where: { userId },
      relations: ['collection', 'voucher', 'voucher.rewardCatalog'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return paginate(data, total, page, limit);
  }

  // ── BALANCE DE PUNTOS ──────────────────────────────────────────────────────
  async getPointsBalance(userId: string) {
    const userExists = await this.usersRepo.findOne({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    const userPoints = await this.userPointsRepo.findOne({ where: { userId } });

    return {
      userId,
      balancePoints:  userPoints?.balancePoints ?? 0,
      lastUpdatedAt:  userPoints?.lastUpdatedAt ?? null,
    };
  }

  // ── ÚLTIMA ENTREGA DE BASURA ───────────────────────────────────────────────
  async getLastCollection(userId: string) {
    const userExists = await this.usersRepo.findOne({ where: { id: userId } });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    const last = await this.collectionRepo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items', 'items.recyclingType'],
    });

    if (!last) {
      return { userId, lastCollection: null, message: 'El vecino aún no ha realizado ninguna entrega.' };
    }

    return {
      userId,
      lastCollection: {
        id:                last.id,
        createdAt:         last.createdAt,
        pointsAwarded:     last.pointsAwarded,
        verificationMethod:last.verificationMethod,
        truckId:           last.truckId,
        items: (last.items ?? []).map(item => ({
          recyclingType: item.recyclingType?.name ?? null,
          quantity:      item.quantity,
          pointsEarned:  item.pointsEarned,
        })),
      },
    };
  }

  // ── DASHBOARD VECINO (todo en una sola llamada) ───────────────────────────
  // ── RANKING HELPER ────────────────────────────────────────────────────────
  // Usa PERCENT_RANK() de PostgreSQL: una sola query, liviana con índice en balancePoints.
  // Devuelve qué porcentaje de vecinos el usuario SUPERA (0.0 = último, 1.0 = primero).
  // Cacheado 5 minutos por municipio para no recalcular con cada llamada al dashboard.
  private rankingCache = new Map<string, { ts: number; data: { total: number; percentile: number } }>();

  private async getRanking(userId: string, municipalityId: string): Promise<{
    percentileSuperado: number;  // 0–100: % de vecinos que supera
    totalVecinos: number;
    label: string;
    tier: string;                // 'top5' | 'top10' | 'top25' | 'top50' | 'resto'
  }> {
    const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos
    const cacheKey = `${municipalityId}:${userId}`;
    const cached = this.rankingCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return this.buildRankingResult(cached.data.percentile, cached.data.total);
    }

    // PERCENT_RANK() = (rank-1)/(total-1) → 0 = menor, 1 = mayor
    // Usamos 1 - PERCENT_RANK para que 1 = supera a todos, 0 = supera a nadie
    const result = await this.dataSource.query(`
      SELECT
        pr.percent_rank_val,
        pr.total_neighbors
      FROM (
        SELECT
          up."userId",
          1 - PERCENT_RANK() OVER (ORDER BY up."balancePoints" ASC) AS percent_rank_val,
          COUNT(*) OVER () AS total_neighbors
        FROM "userPoints" up
        INNER JOIN users u ON u.id = up."userId"
        WHERE u."municipalityId" = $1
          AND u."isActive" = true
          AND u."isArchived" = false
          AND u."userType" = 'NEIGHBOR'
      ) pr
      WHERE pr."userId" = $2
      LIMIT 1
    `, [municipalityId, userId]);

    if (!result || result.length === 0) {
      return { percentileSuperado: 0, totalVecinos: 0, label: 'Aún sin puntos', tier: 'resto' };
    }

    const percentile = parseFloat(result[0].percent_rank_val) * 100;
    const total      = parseInt(result[0].total_neighbors);

    this.rankingCache.set(cacheKey, { ts: Date.now(), data: { percentile, total } });
    return this.buildRankingResult(percentile, total);
  }

  private buildRankingResult(percentile: number, total: number) {
    const p = Math.round(percentile);
    let tier: string, label: string;
    if (p >= 95) { tier = 'top5';  label = '¡Estás entre los mejores recicladores! 🏆'; }
    else if (p >= 90) { tier = 'top10'; label = 'Estás en el top 10% de tu municipio ⭐'; }
    else if (p >= 75) { tier = 'top25'; label = 'Superas al 75% de vecinos 👍'; }
    else if (p >= 50) { tier = 'top50'; label = 'Estás por encima de la mitad 💪'; }
    else { tier = 'resto'; label = '¡Cada entrega suma! Sigue reciclando ♻️'; }
    return { percentileSuperado: p, totalVecinos: total, label, tier };
  }

  async getDashboard(userId: string) {
    const userExists = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['address'],
    });
    if (!userExists) throw new NotFoundException('Usuario no encontrado');

    const [userPoints, lastCollection, recentTx, ranking] = await Promise.all([
      this.userPointsRepo.findOne({ where: { userId } }),
      this.collectionRepo.findOne({
        where: { userId },
        order: { createdAt: 'DESC' },
        relations: ['items', 'items.recyclingType'],
      }),
      this.pointsTxRepo.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['voucher', 'voucher.rewardCatalog'],
      }),
      this.getRanking(userId, userExists.municipalityId),
    ]);

    return {
      userId,
      balance: {
        balancePoints: userPoints?.balancePoints ?? 0,
        lastUpdatedAt: userPoints?.lastUpdatedAt ?? null,
      },
      ranking,
      lastCollection: lastCollection ? {
        id:                 lastCollection.id,
        createdAt:          lastCollection.createdAt,
        pointsAwarded:      lastCollection.pointsAwarded,
        verificationMethod: lastCollection.verificationMethod,
        truckId:            lastCollection.truckId,
        items: (lastCollection.items ?? []).map(item => ({
          recyclingType: item.recyclingType?.name ?? null,
          quantity:      item.quantity,
          pointsEarned:  item.pointsEarned,
        })),
      } : null,
      recentTransactions: recentTx.map(tx => ({
        id:              tx.id,
        transactionType: tx.transactionType,
        points:          tx.points,
        createdAt:       tx.createdAt,
        voucher:         tx.voucher ? {
          id:          tx.voucher.id,
          rewardName:  tx.voucher.rewardCatalog?.name ?? null,
        } : null,
      })),
      notificationSettings: {
        notifyBefore:        userExists.address?.notifyBefore ?? 5,
        activateNotification:userExists.address?.activateNotification ?? true,
      },
    };
  }
}
