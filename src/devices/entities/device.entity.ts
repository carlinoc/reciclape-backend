import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, nullable: true })
  brand: string;

  @Column({ length: 100, nullable: true })
  model: string;

  @Column({ length: 100, nullable: true })
  serie: string;

  @Column({ length: 50, nullable: true })
  status: string;

  @Column({ type: 'date', nullable: true })
  warrantyExpiryDate: Date;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @ManyToOne(() => Municipality, (m) => m.id, { eager: true })
  municipality: Municipality;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;
}
