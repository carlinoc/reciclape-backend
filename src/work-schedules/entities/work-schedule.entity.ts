import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { WorkStatus } from '../enums/work-status.enum';
import { RestReason } from '../enums/rest-reason.enum';

@Entity('workSchedules')
@Unique(['userId', 'workDate']) // Un operario solo puede tener un estado por día
export class WorkSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'date' })
  workDate: string;

  @Column({ type: 'varchar', length: 20 })
  status: WorkStatus;

  // Motivo del descanso (solo aplica cuando status = REST o RETEN)
  @Column({ type: 'varchar', length: 30, nullable: true })
  reason?: RestReason;

  // Fecha por la que se compensa el descanso (ej: trabajó el domingo 08/06 → descansa el miércoles 11/06)
  @Column({ type: 'date', nullable: true })
  compensatoryForDate?: string;

  // Quién reemplazó al operario en caso de descanso
  @Column({ type: 'uuid', nullable: true })
  replacedByUserId?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  /* Relations */
  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'replacedByUserId' })
  replacedByUser?: User;

  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;
}
