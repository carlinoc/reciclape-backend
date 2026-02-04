import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { Voucher } from './entities/voucher.entity';
import { UserPoint } from '../user-points/entities/user-point.entity'; // Ajusta la ruta
import { PointsTransaction } from '../collections/entities/points-transaction.entity';
import { RewardCatalog } from '../rewards-catalog/entities/reward-catalog.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Voucher, 
      UserPoint, 
      PointsTransaction, 
      RewardCatalog
    ]),
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
})
export class VouchersModule {}