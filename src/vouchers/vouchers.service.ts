import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { Voucher } from './entities/voucher.entity';
import { UserPoint } from '../user-points/entities/user-point.entity';
import { PointsTransaction } from '../collections/entities/points-transaction.entity';
import { RewardCatalog } from '../rewards-catalog/entities/reward-catalog.entity';
import { TransactionType } from 'src/collections/enums/transaction-type.enum';
import { VoucherStatus } from './enums/voucher-status.enum';
import { randomBytes } from 'crypto';
import { PaginationDto, paginate } from 'src/common/dto/pagination.dto';

@Injectable()
export class VouchersService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Voucher)
    private readonly voucherRepo: Repository<Voucher>,
  ) {}

  async create(createDto: CreateVoucherDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { userId, rewardCatalogId } = createDto;

      // 1. Validar Stock del Premio — SELECT FOR UPDATE bloquea la fila hasta el COMMIT.
      // Esto serializa canjes simultáneos: el segundo canje espera al primero antes de
      // leer el stock, eliminando la race condition donde ambos pasaban la validación.
      const reward = await queryRunner.manager
        .createQueryBuilder(RewardCatalog, 'r')
        .setLock('pessimistic_write')
        .where('r.id = :id', { id: rewardCatalogId })
        .getOne();
      if (!reward || reward.stock <= 0) throw new Error('Premio sin stock disponible.');

      // 2. Validar Saldo del Usuario — también con FOR UPDATE para evitar doble descuento.
      const userPoints = await queryRunner.manager
        .createQueryBuilder(UserPoint, 'up')
        .setLock('pessimistic_write')
        .where('up.userId = :userId', { userId })
        .getOne();
      if (!userPoints || userPoints.balancePoints < reward.pointsRequired) {
        throw new Error('Puntos insuficientes para este canje.');
      }

      const voucherCode = randomBytes(4).toString('hex').toUpperCase();

      // 3. Crear el Voucher en estado GENERATED
      const voucher = queryRunner.manager.create(Voucher, {
        ...createDto,
        pointsUsed: reward.pointsRequired,
        status: VoucherStatus.GENERATED,
        voucherCode: voucherCode,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días de validez
      });
      const savedVoucher = await queryRunner.manager.save(voucher);

      // 4. Registrar Transacción REDEEM (Resta de puntos)
      const pointsTx = queryRunner.manager.create(PointsTransaction, {
        userId,
        voucherId: savedVoucher.id,
        transactionType: TransactionType.REDEEM,
        points: reward.pointsRequired,
        createdAt: new Date(),
      });
      await queryRunner.manager.save(pointsTx);

      // 5. Actualizar Balance de Usuario (Resta Atómica)
      await queryRunner.manager.update(UserPoint, { userId }, {
        balancePoints: userPoints.balancePoints - reward.pointsRequired,
        lastUpdatedAt: new Date(),
      });

      // 6. Descontar Stock
      await queryRunner.manager.update(RewardCatalog, rewardCatalogId, {
        stock: reward.stock - 1,
      });

      await queryRunner.commitTransaction();
      return savedVoucher;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(err.message);
    } finally {
      await queryRunner.release();
    }
  }

  // Cambiar a REDEEMED (Cuando el usuario reclama el premio físicamente o por tarea programada)
  async markAsRedeemed(id: string) {
    const voucher = await this.voucherRepo.findOneBy({ id });
    if (!voucher) throw new NotFoundException('Voucher no encontrado.');
    if (voucher.status !== VoucherStatus.GENERATED) throw new BadRequestException(`Estado del voucher: ${voucher.status}`);

    voucher.status = VoucherStatus.REDEEMED;
    voucher.redeemedAt = new Date();
    await this.voucherRepo.save(voucher);

    return this.voucherRepo.findOne({
      where: { id },
      relations: ['rewardCatalog', 'user'],
    });
  }

  // Cambiar a EXPIRED (Proceso que se puede llamar por tarea programada o manual)
  async markAsExpired(id: string) {
    const voucher = await this.voucherRepo.findOneBy({ id });
    if (!voucher) throw new NotFoundException('Voucher no encontrado.');
    if (voucher.status !== VoucherStatus.GENERATED) throw new BadRequestException('Solo se pueden expirar vouchers generados.');

    voucher.status = VoucherStatus.EXPIRED;
    await this.voucherRepo.save(voucher);

    return this.voucherRepo.findOne({
      where: { id },
      relations: ['rewardCatalog', 'user'],
    });
  }

  async findAll(municipalityId?: string) {
    return await this.voucherRepo.find({
      where: municipalityId ? { municipalityId } : {},
      relations: ['rewardCatalog', 'user'],
      order: { issuedAt: 'DESC' }
    });
  }

  async findByMunicipality(municipalityId: string, pagination: PaginationDto, rewardCatalogId?: string, userId?: string, status?: string) {
    if (!municipalityId) {
      throw new BadRequestException('El parámetro municipalityId es requerido');
    }

    const { page = 1, limit = 20 } = pagination;

    const queryBuilder = this.voucherRepo
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.rewardCatalog', 'rewardCatalog')
      .leftJoinAndSelect('voucher.user', 'user')
      .where('voucher.municipalityId = :municipalityId', { municipalityId })
      .orderBy('voucher.issuedAt', 'DESC');

    if (rewardCatalogId) {
      queryBuilder.andWhere('voucher.rewardCatalogId = :rewardCatalogId', { rewardCatalogId });
    }
    if (userId) {
      queryBuilder.andWhere('voucher.userId = :userId', { userId });
    }
    if (status) {
      queryBuilder.andWhere('voucher.status = :status', { status });
    }

    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return paginate(data, total, page, limit);
  }

  async findOne(id: string) {
    const voucher = await this.voucherRepo.findOne({
      where: { id },
      relations: ['rewardCatalog', 'user'],
    });
    if (!voucher) throw new NotFoundException('Voucher no encontrado.');
    return voucher;
  }
  
}