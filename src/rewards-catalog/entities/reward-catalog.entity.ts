import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { Voucher } from 'src/vouchers/entities/voucher.entity';

@Entity('rewardsCatalog')
export class RewardCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ length: 50, nullable: true })
  rewardType?: string;

  @Column({ type: 'int' })
  pointsRequired: number;

  @Column({ type: 'int' })
  stock: number;

  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date;

  //RELACION CON VOUCHERS
  @OneToMany(() => Voucher, (voucher) => voucher.rewardCatalog)
  vouchers: Voucher[];
    
}
