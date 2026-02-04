import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Zone } from '../../zones/entities/zones.entity';
import { CollectionAreaType } from '../../collection-area-types/entities/collection-area-type.entity';
import { RouteSchedule } from '../../route-schedules/entities/route-schedule.entity';

@Entity('collectionAreas')
export class CollectionArea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'uuid' })
  areaTypeId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => Zone, (zone) => zone.id, { eager: true })
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;
  
  @ManyToOne(() => CollectionAreaType, (areaType) => areaType.id, { eager: true })
  @JoinColumn({ name: 'areaTypeId' })
  collectionAreaType: CollectionAreaType;

  @OneToMany(() => RouteSchedule, (routeSchedule) => routeSchedule.collectionArea)
  routeSchedules: RouteSchedule[];
}
