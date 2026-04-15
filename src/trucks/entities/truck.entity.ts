import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, OneToOne } from 'typeorm';
import { RegistrationStatus } from '../enums/registration-status.enum';
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

  @Column({ type: 'varchar', unique: true, nullable: true })
  licensePlate: string;

  @Column()
  truckTypeId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'varchar', nullable: true })
  deviceId?: string;

  @Column({ type: 'varchar', nullable: true })
  qrCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  municipalityId: string;

  @Column({ nullable: true, type: 'int' })
  capacity: number;

  @Column({ nullable: true, type: 'int' })
  volume: number;

  @Column({ type: 'varchar', length: 20, default: RegistrationStatus.ACTIVE })
  registrationStatus: RegistrationStatus;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TruckType)
  @JoinColumn({ name: 'truckTypeId' })
  truckType: TruckType;

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
