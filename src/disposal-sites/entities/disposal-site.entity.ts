import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';

@Entity('disposalSites')
export class DisposalSite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ type: 'point', nullable: true })
  location?: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /* Relations */
  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;
}
