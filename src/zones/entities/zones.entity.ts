import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { RouteSchedule } from 'src/route-schedules/entities/route-schedule.entity';

@Entity('zones')
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @ManyToOne(() => Municipality, (m) => m.id, { eager: true })
  municipality: Municipality;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ length: 20, nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date;

  @OneToMany(() => RouteSchedule, (routeSchedule) => routeSchedule.zone)
  routeSchedules: RouteSchedule[];
}
