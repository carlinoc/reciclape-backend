import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Survey } from '../../surveys/entities/survey.entity';

@Entity('surveyQuestions')
@Unique(['surveyId', 'questionOrder'])
export class SurveyQuestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  surveyId: string;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'varchar', length: 50 })
  questionType: string;
  // Ej: SINGLE_CHOICE, MULTIPLE_CHOICE, TEXT, RATING

  @Column({ type: 'int' })
  questionOrder: number;

  @Column({ type: 'jsonb', nullable: true })
  optionsRawData?: any;

  /* Relations */
  @ManyToOne(() => Survey, (survey) => survey.questions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'surveyId' })
  survey: Survey;
}
