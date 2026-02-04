import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Address } from './entities/address.entity';
import { OperatorProfile } from './entities/operator-profile.entity';
import { NeighborsController } from './controllers/neighbors.controller';
import { OperatorsController } from './controllers/operators.controller';
import { AdminsController } from './controllers/admins.controller';
import { NeighborsService } from './services/neighbors.service';
import { OperatorsService } from './services/operators.service';
import { AdminsService } from './services/admins.service';
import { PointsTransaction } from 'src/collections/entities/points-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Address, OperatorProfile, PointsTransaction]),
  ],
  controllers: [NeighborsController, OperatorsController, AdminsController],
  providers: [NeighborsService, OperatorsService, AdminsService],
})
export class UsersModule {}
