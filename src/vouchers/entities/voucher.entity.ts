import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RewardCatalog } from '../../rewards-catalog/entities/reward-catalog.entity';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { PointsTransaction } from 'src/collections/entities/points-transaction.entity';

@Entity('vouchers')
export class Voucher {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid')
  rewardCatalogId: string;

  @Column('uuid')
  municipalityId: string;

  @Column('uuid', { nullable: true })
  issuedByUserId: string;

  @Column('integer')
  pointsUsed: number;
  
  @Column('decimal', { precision: 2, scale: 2 })
  discountAmount: number;

  @Column({ unique: true })
  voucherCode: string;

  @Column({ default: 'GENERATED' }) // GENERATED, REDEEMED, EXPIRED
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  issuedAt: Date;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  redeemedAt: Date;

  //RELACION CON MUNICIPALIDAD
  @ManyToOne(() => Municipality, (m) => m.vouchers)
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  //RELACION CON REWARD CATALOG
  @ManyToOne(() => RewardCatalog, (r) => r.vouchers)
  @JoinColumn({ name: 'rewardCatalogId' })
  rewardCatalog: RewardCatalog;

  //RELACION CON USUARIO
  @ManyToOne(() => User, (u) => u.voucher)
  @JoinColumn({ name: 'userId' })
  user: User;
  
  // RELACIÓN CON issuedByUserId
  @ManyToOne(() => User, (u) => u.voucher)
  @JoinColumn({ name: 'issuedByUserId' })
  issuedByUser: User;

  // RELACIÓN CON pointsTransactions
  @OneToOne(() => PointsTransaction, (tx) => tx.voucher)
  transactions: PointsTransaction;
  
}