import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Truck } from '../../trucks/entities/truck.entity';
import { Zone } from '../../zones/entities/zones.entity';
import { CollectionArea } from '../../collection-areas/entities/collection-area.entity';

@Entity('routeSchedules')
export class RouteSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  truckId: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid', nullable: true })
  collectionAreaId?: string;

  @Column({ type: 'int' })
  dayOfWeek: number; // 1 = Monday, 7 = Sunday

  @Column({ type: 'boolean', default: false })
  isMainRoad: boolean;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column({ type: 'jsonb', nullable: true })
  routeSegmentDetails?: any;
  
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

  @ManyToOne(
    () => CollectionArea,
    (area) => area.routeSchedules,
    {
      nullable: true,
      onDelete: 'SET NULL',
    },
  )
  @JoinColumn({ name: 'collectionAreaId' })
  collectionArea?: CollectionArea;
}
