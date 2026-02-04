import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, OneToOne } from 'typeorm';
import { Zone } from 'src/zones/entities/zones.entity';
import { Device } from 'src/devices/entities/device.entity';
import { TruckType } from 'src/truck-type/entities/truck-type.entity';
import { RouteSchedule } from 'src/route-schedules/entities/route-schedule.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { TruckPosition } from 'src/truck-positions/entities/truck-position.entity';
import { OperatorProfile } from 'src/users/entities/operator-profile.entity';

@Entity('trucks')
export class Truck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  licensePlate: string;

  @Column()
  truckTypeId: string;

  @Column()
  zoneId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  deviceId?: string;

  @Column({ nullable: true })
  qrCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date;

  @Column({ nullable: true })
  municipalityId: string;
  
  @ManyToOne(() => TruckType)
  @JoinColumn({ name: 'truckTypeId' })
  truckType: TruckType;

  @ManyToOne(() => Zone)
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @ManyToOne(() => Device, { nullable: true })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @OneToMany(() => RouteSchedule, (routeSchedule) => routeSchedule.truck)
  routeSchedules: RouteSchedule[];

  // RELACIÓN CON COLLECTIONS
  // Un truck tiene muchas colecciones
  @OneToMany(() => Collection, (collection) => collection.truck)
  collections: Collection[];  

  // RELACIÓN CON POSICIONES (truck-positions)
  @OneToMany(() => TruckPosition, (position) => position.truck)
  positions: TruckPosition[]; 

  // RELACIÓN CON OPERADORES
  @OneToOne(() => OperatorProfile, (operatorProfile) => operatorProfile.truck)
  operatorProfiles: OperatorProfile[];
  
}
