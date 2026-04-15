import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { SurveyQuestion } from '../../survey-questions/entities/survey-question.entity';

@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  rewardPoints: number;

  @Column({ type: 'int' })
  totalQuestions: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'date', nullable: true })
  startDate?: string;

  @Column({ type: 'date', nullable: true })
  endDate?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'boolean', default: false })
  isReady: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  publishAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  closeAt: Date;

  /* Relations */
  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  @OneToMany(() => SurveyQuestion, (question) => question.survey)
  questions: SurveyQuestion[];
}
