import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Truck } from '../../trucks/entities/truck.entity';
import { User } from '../../users/entities/user.entity';

@Entity('dailyCrewAssignment')
@Unique(['date', 'userId'])
@Unique(['date', 'truckId', 'userId'])
export class DailyCrewAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: string;

  @Column('uuid')
  truckId: string;

  @Column('uuid')
  userId: string;

  @Column({ length: 50 })
  personnelRole: string;

  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
