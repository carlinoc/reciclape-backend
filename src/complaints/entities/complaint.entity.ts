import {
  Column, CreateDateColumn, Entity, ManyToOne,
  JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { User } from 'src/users/entities/user.entity';
import { ComplaintCategory } from './complaint-category.entity';
import { ComplaintStatus } from '../dto/update-complaint.dto';

@Entity('complaints')
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ type: 'uuid' })
  categoryId: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  address: string | null;

  @Column({ type: 'uuid', nullable: true })
  zoneId: string | null;

  @Column({ type: 'date' })
  incidentDate: Date;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  evidencePhotos: string[] | null;

  @Column({ type: 'point', nullable: true })
  location: string | null;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.OPEN })
  status: ComplaintStatus;

  @Column({ type: 'uuid', nullable: true })
  assignedAdminId: string | null;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string | null;

  @Column({ type: 'uuid', nullable: true })
  detectedTruckId: string | null;

  @Column({ type: 'boolean', default: false })
  isPositionVerified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // RELACIONES
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Municipality)
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  @ManyToOne(() => ComplaintCategory)
  @JoinColumn({ name: 'categoryId' })
  category: ComplaintCategory;
}
