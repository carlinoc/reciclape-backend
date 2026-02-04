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

      // 1. Validar Stock del Premio
      const reward = await queryRunner.manager.findOne(RewardCatalog, {
        where: { id: rewardCatalogId },
      });
      if (!reward || reward.stock <= 0) throw new Error('Premio sin stock disponible.');

      // 2. Validar Saldo del Usuario
      const userPoints = await queryRunner.manager.findOne(UserPoint, {
        where: { userId },
      });
      if (!userPoints || userPoints.balancePoints < reward.pointsRequired) {
        throw new Error('Puntos insuficientes para este canje.');
      }

      // 3. Crear el Voucher en estado GENERATED
      const voucher = queryRunner.manager.create(Voucher, {
        ...createDto,
        pointsUsed: reward.pointsRequired,
        status: VoucherStatus.GENERATED,
        voucherCode: Math.random().toString(36).substring(2, 10).toUpperCase(),
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
    return {
      statusCode: 200,
      message: `Voucher ${id} marcado como REDEEMED.`,
    };
  }

  // Cambiar a EXPIRED (Proceso que se puede llamar por tarea programada o manual)
  async markAsExpired(id: string) {
    const voucher = await this.voucherRepo.findOneBy({ id });
    if (!voucher) throw new NotFoundException('Voucher no encontrado.');
    if (voucher.status !== VoucherStatus.GENERATED) throw new BadRequestException('Solo se pueden expirar vouchers generados.');

    voucher.status = VoucherStatus.EXPIRED;
    await this.voucherRepo.save(voucher);
    return {
      statusCode: 200,
      message: `Voucher ${id} marcado como EXPIRED.`,
    };
  }

  async findAll(municipalityId?: string) {
    return await this.voucherRepo.find({
      where: municipalityId ? { municipalityId } : {},
      relations: ['rewardCatalog', 'user'],
      order: { issuedAt: 'DESC' }
    });
  }
}