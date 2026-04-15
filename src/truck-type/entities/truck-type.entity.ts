import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('truckType')
export class TruckType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  type: string;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;
}
