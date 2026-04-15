import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Truck } from '../../trucks/entities/truck.entity';
import { User } from '../../users/entities/user.entity';

export enum Shift {
  MORNING   = 'MORNING',   // Mañana
  AFTERNOON = 'AFTERNOON', // Tarde
  NIGHT     = 'NIGHT',     // Noche
}

@Entity('dailyCrewAssignment')
// Un operador solo puede estar en un turno específico de un día (no dos veces en el mismo turno-día)
@Unique(['date', 'shift', 'userId'])
// Un operador no puede estar en dos camiones en el mismo turno-día
@Unique(['date', 'shift', 'truckId', 'userId'])
export class DailyCrewAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: Shift })
  shift: Shift;

  @Column('uuid')
  truckId: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 50 })
  personnelRole: string;

  @Column('uuid')
  municipalityId: string;

  // Nota opcional: "Cubre descanso del titular", "Domingo/Feriado — rotación", etc.
  @Column({ type: 'text', nullable: true })
  notes?: string;

  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
