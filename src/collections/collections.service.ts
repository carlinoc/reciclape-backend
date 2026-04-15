import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { Collection } from './entities/collection.entity';
import { CollectionItem } from './entities/collection-item.entity';
import { PointsTransaction } from './entities/points-transaction.entity';
import { TransactionType } from './enums/transaction-type.enum';
import { FilterCollectionsDto } from './dto/filter-conllections.dto';
import { UserPoint } from 'src/user-points/entities/user-point.entity';
import { VerificationMethod } from './enums/verification-method.enum';
import { RecyclingType } from 'src/recycling-type/entities/recycling-type.entity';
import { User } from 'src/users/entities/user.entity';
import { QrScanCollectionDto } from './dto/qr-scan-collection.dto';
import { paginate } from 'src/common/dto/pagination.dto';

@Injectable()
export class CollectionsService {
  constructor(private dataSource: DataSource) {}

  async create(createDto: CreateCollectionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { items, ...collectionData } = createDto;
      const totalPoints = items.reduce((sum, i) => sum + i.pointsEarned, 0);

      // 1. Crear la cabecera de la colección  
      const collection = queryRunner.manager.create(Collection, {
        ...collectionData,
        pointsAwarded: totalPoints,
        operatorUserId: createDto.operatorUserId,
      });
      const savedCollection = await queryRunner.manager.save(collection);

      // 2. Crear los ítems de reciclaje
      const collectionItems = items.map((i) =>
        queryRunner.manager.create(CollectionItem, {
          ...i,
          collectionId: savedCollection.id,
        }),
      );
      await queryRunner.manager.save(collectionItems);

      // 3. Registrar la transacción de puntos (Historial)
      const pointsTx = queryRunner.manager.create(PointsTransaction, {
        userId: savedCollection.userId,
        collectionId: savedCollection.id,
        points: totalPoints,
        transactionType: createDto.verificationMethod === VerificationMethod.QR_NEIGHBOR ? TransactionType.EARN_GARBAGE : TransactionType.EARN_RECYCLED,
      });
      await queryRunner.manager.save(pointsTx);

      // 4. ACTUALIZAR BALANCE (UserPoints)
      //const userPointsRepo = queryRunner.manager.getRepository('userPoints');

      // Intentamos actualizar primero
      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update('userPoints')
        .set({
          balancePoints: () => `balancePoints + ${totalPoints}`,
          lastUpdatedAt: new Date(),
        })
        .where('userId = :userId', { userId: savedCollection.userId })
        .execute();

      // Si no se actualizó ninguna fila (affected === 0), significa que el usuario no tiene registro de puntos aún
      if (updateResult.affected === 0) {
        await queryRunner.manager.insert('userPoints', {
          userId: savedCollection.userId,
          balancePoints: totalPoints,
          lastUpdatedAt: new Date(),
        });
      }

      await queryRunner.commitTransaction();
      return savedCollection;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al registrar la colección: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  // ── QR SCAN — escaneo simple desde la app móvil ──────────────────────────
  async qrScan(dto: QrScanCollectionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Validar que el vecino existe y obtener su municipalityId
      const user = await queryRunner.manager.findOne(User, {
        where: { id: dto.userId },
        select: ['id', 'municipalityId', 'isActive'],
      });
      if (!user) throw new BadRequestException('Vecino no encontrado.');
      if (!user.isActive) throw new BadRequestException('El vecino no está activo.');

      // 2. Obtener el tipo de reciclaje "basura general" (isGarbage = true)
      //    de la municipalidad del vecino
      const garbageType = await queryRunner.manager.findOne(RecyclingType, {
        where: { municipalityId: user.municipalityId, isGarbage: true, isActive: true, isArchived: false },
      });
      if (!garbageType) {
        throw new BadRequestException(
          'No existe un tipo de reciclaje "basura general" configurado para esta municipalidad. ' +
          'Contactar al administrador.',
        );
      }

      const pointsEarned = garbageType.pointsGiven;

      // 3. Crear la colección
      const collection = queryRunner.manager.create(Collection, {
        userId:             dto.userId,
        truckId:            dto.truckId,
        municipalityId:     user.municipalityId,
        operatorUserId:     dto.operatorUserId || undefined,
        pointsAwarded:      pointsEarned,
        verificationMethod: VerificationMethod.QR_NEIGHBOR,
      } as any);
      const savedCollection = await queryRunner.manager.save(Collection, collection);

      // 4. Crear el ítem con quantity = 1 (una entrega)
      const item = queryRunner.manager.create(CollectionItem, {
        collectionId:    savedCollection.id,
        recyclingTypeId: garbageType.id,
        quantity:        1,
        pointsEarned:    pointsEarned,
      });
      await queryRunner.manager.save(CollectionItem, item);

      // 5. Registrar transacción de puntos
      const tx = queryRunner.manager.create(PointsTransaction, {
        userId:          dto.userId,
        collectionId:    savedCollection.id,
        points:          pointsEarned,
        transactionType: TransactionType.EARN_GARBAGE,
      });
      await queryRunner.manager.save(PointsTransaction, tx);

      // 6. Actualizar balance del vecino (upsert)
      const updateResult = await queryRunner.manager
        .createQueryBuilder()
        .update('userPoints')
        .set({ balancePoints: () => `"balancePoints" + ${pointsEarned}`, lastUpdatedAt: new Date() })
        .where('"userId" = :userId', { userId: dto.userId })
        .execute();

      if (updateResult.affected === 0) {
        await queryRunner.manager.insert('userPoints', {
          userId: dto.userId,
          balancePoints: pointsEarned,
          lastUpdatedAt: new Date(),
          createdAt: new Date(),
        });
      }

      await queryRunner.commitTransaction();

      return {
        message:       '¡Entrega registrada correctamente!',
        collectionId:  savedCollection.id,
        pointsEarned,
        totalPoints:   pointsEarned,
        recyclingType: garbageType.name,
        createdAt:     savedCollection.createdAt,
      };

    } catch (err) {
      await queryRunner.rollbackTransaction();
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Error al registrar la entrega: ' + err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(filters: FilterCollectionsDto) {
    const { municipalityId, userId, operatorUserId, truckId, zoneId, page = 1, limit = 20 } = filters;

    const queryBuilder = this.dataSource.getRepository(Collection).createQueryBuilder('collection')
      .leftJoinAndSelect('collection.items', 'collectionItems')
      .leftJoinAndSelect('collectionItems.recyclingType', 'recyclingType')
      .leftJoinAndSelect('collection.user', 'user')
      .leftJoinAndSelect('user.address', 'address')
      .leftJoinAndSelect('collection.truck', 'truck')
      .leftJoinAndSelect('collection.operatorUser', 'operator');

    if (municipalityId) {
      queryBuilder.andWhere('collection.municipalityId = :municipalityId', { municipalityId });
    }
    if (userId) {
      queryBuilder.andWhere('collection.userId = :userId', { userId });
    }
    if (operatorUserId) {
      queryBuilder.andWhere('collection.operatorUserId = :operatorUserId', { operatorUserId });
    }
    if (truckId) {
      queryBuilder.andWhere('collection.truckId = :truckId', { truckId });
    }
    if (zoneId) {
      queryBuilder.andWhere('address.zoneId = :zoneId', { zoneId });
    }

    queryBuilder.orderBy('collection.createdAt', 'DESC');

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const collection = await this.dataSource.getRepository(Collection).findOne({
      where: { id },
      relations: ['items', 'user', 'truck', 'operatorUser']
    });
    if (!collection) throw new NotFoundException('Colección no encontrada');
    return collection;
  }

  async remove(id: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Buscamos la colección para saber cuántos puntos restar y a qué usuario
      const collection = await queryRunner.manager.findOne(Collection, {
        where: { id },
        relations: ['items'] // Opcional, pero necesitamos asegurar que tenemos los puntosAwarded
      });

      if (!collection) {
        throw new NotFoundException(`La colección con ID ${id} no existe.`);
      }

      const { userId, pointsAwarded } = collection;

      // 2. Eliminar los items de la colección (por integridad referencial si no usas CASCADE)
      await queryRunner.manager.delete(CollectionItem, { collectionId: id });

      // 3. Eliminar la transacción de puntos asociada
      await queryRunner.manager.delete(PointsTransaction, { collectionId: id });

      // 4. RESTAR los puntos del balance general del usuario (UserPoints)
      // Verificamos si el usuario tiene registro de puntos
      const userPointsRepo = queryRunner.manager.getRepository(UserPoint);
      const userPoints = await userPointsRepo.findOne({
        where: { userId }
      });

      if (userPoints) {
        // Usamos decremento atómico para evitar errores de concurrencia
        await queryRunner.manager
        .createQueryBuilder(UserPoint, 'userPoints')
        .update()
        .set({
          balancePoints: () => `balancePoints - ${pointsAwarded}`,
          lastUpdatedAt: new Date(),
        })
        .where('userId = :userId', { userId })
        .execute();  
      }

      // 5. Finalmente, eliminar la cabecera de la colección
      await queryRunner.manager.delete(Collection, id);

      // Si todo salió bien, confirmamos los cambios
      await queryRunner.commitTransaction();
      
      return {
        statusCode: 200,
        message: `Colección ${id} eliminada y ${pointsAwarded} puntos revertidos al usuario ${userId}.`,
      };

    } catch (err) {
      // Si algo falla, revertimos todo (la colección no se borra y los puntos no se restan)
      await queryRunner.rollbackTransaction();
      throw new BadRequestException('Error al eliminar la colección: ' + err.message);
    } finally {
      // Liberamos el query runner
      await queryRunner.release();
    }
  }
}
