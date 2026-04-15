import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Truck } from '../../trucks/entities/truck.entity';
import { Zone } from '../../zones/entities/zones.entity';
import { RouteShift, RouteTurnNumber } from '../enums/route-schedule.enums';


@Entity('routeSchedules')
export class RouteSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  truckId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'int', array: true })
  daysOfWeek: number[]; // [1,4] = Lunes y Jueves, [2,5] = Martes y Viernes, etc.

  @Column({ type: 'enum', enum: RouteShift })
  shift: RouteShift; // MORNING | AFTERNOON | NIGHT

  @Column({ type: 'enum', enum: RouteTurnNumber, default: RouteTurnNumber.FIRST })
  turnNumber: RouteTurnNumber; // FIRST | SECOND

  @Column({ type: 'boolean', default: false })
  isMainRoad: boolean;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'jsonb', nullable: true })
  routeSegmentDetails?: any;

  @Column({ type: 'date' })
  effectiveFrom: string;

  @Column({ type: 'date', nullable: true })
  effectiveTo?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /* Relations */

  @ManyToOne(() => Truck, (truck) => truck.routeSchedules, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => Zone, (zone) => zone.routeSchedules, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;
}
