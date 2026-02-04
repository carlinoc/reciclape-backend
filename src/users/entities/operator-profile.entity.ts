import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Truck } from '../../trucks/entities/truck.entity';

@Entity('operatorProfiles')
export class OperatorProfile {
  @PrimaryColumn()
  userId: string;

  @Column()
  personnelRole: string;

  @Column({ nullable: true })
  assignedTruckId: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToOne(() => User, (user) => user.operatorProfile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Truck, { nullable: true })
  @JoinColumn({ name: 'assignedTruckId' })
  truck: Truck;
}
