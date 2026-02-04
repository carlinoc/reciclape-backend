import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Check,
  OneToOne
} from 'typeorm';
import { Collection } from './collection.entity';
import { TransactionType } from '../enums/transaction-type.enum';
import { Voucher } from 'src/vouchers/entities/voucher.entity';

@Entity('pointsTransactions')
@Check('"transactionType" IN (1,2,3)')
export class PointsTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  collectionId: string;

  @Column('varchar', { length: 10 })
  transactionType: TransactionType;

  @Column('int')
  points: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column('uuid', { nullable: true })
  voucherId?: string;

  @ManyToOne(() => Collection, (collection) => collection.transactions)
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  @OneToOne(() => Voucher, (voucher) => voucher.transactions)
  @JoinColumn({ name: 'voucherId' })
  voucher: Voucher;

  // @ManyToOne(() => Voucher, (voucher) => voucher.transactions)
  // @JoinColumn({ name: 'voucherId' })
  // voucher: Voucher;
}
