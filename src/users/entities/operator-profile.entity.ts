import { Entity, PrimaryColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Truck } from '../../trucks/entities/truck.entity';
import { PersonnelRole } from '../enums/personnel-role.enum';

@Entity('operatorProfiles')
export class OperatorProfile {
  @PrimaryColumn()
  userId: string;

  @Column({ type: 'varchar', length: 20 })
  personnelRole: PersonnelRole;

  @Column({ type: 'uuid', nullable: true })
  assignedTruckId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isRetenPool: boolean;

  @OneToOne(() => User, (user) => user.operatorProfile)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Truck, { nullable: true })
  @JoinColumn({ name: 'assignedTruckId' })
  truck: Truck;
}
