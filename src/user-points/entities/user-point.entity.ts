import { Entity, PrimaryGeneratedColumn, Column, PrimaryColumn } from 'typeorm';

@Entity('userPoints')
export class UserPoint {
  @PrimaryColumn('uuid')
  userId: string;

  @Column('int')
  balancePoints: number;

  @Column('timestamptz')
  lastUpdatedAt: Date;

  @Column('timestamptz')
  createdAt: Date;
}