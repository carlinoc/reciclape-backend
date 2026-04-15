import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RouteSchedule } from '../../route-schedules/entities/route-schedule.entity';
import { CollectionAreaType } from '../../collection-area-types/entities/collection-area-type.entity';

@Entity('collectionAreas')
export class CollectionArea {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid' })
  routeScheduleId: string;

  @Column({ type: 'uuid' })
  areaTypeId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @ManyToOne(() => RouteSchedule, (rs) => rs.id, { eager: true })
  @JoinColumn({ name: 'routeScheduleId' })
  routeSchedule: RouteSchedule;

  @ManyToOne(() => CollectionAreaType, (areaType) => areaType.id, { eager: true })
  @JoinColumn({ name: 'areaTypeId' })
  collectionAreaType: CollectionAreaType;
}
