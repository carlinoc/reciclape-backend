import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Truck } from 'src/trucks/entities/truck.entity';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { ConvoyRole } from '../enums/convoy-role.enum';

@Entity('truckConvoys')
export class TruckConvoy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Fecha operativa del convoy
  @Column({ type: 'date' })
  date: string;

  // Camión principal (compactador)
  @Column({ type: 'uuid' })
  mainTruckId: string;

  // Camión de apoyo (furgón u volquete)
  @Column({ type: 'uuid' })
  supportTruckId: string;

  // Rol que cumple el camión de apoyo
  @Column({ type: 'varchar', length: 30 })
  role: ConvoyRole;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  /* Relations */
  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'mainTruckId' })
  mainTruck: Truck;

  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supportTruckId' })
  supportTruck: Truck;

  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;
}
