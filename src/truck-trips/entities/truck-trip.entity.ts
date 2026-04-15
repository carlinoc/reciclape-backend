import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Truck } from 'src/trucks/entities/truck.entity';
import { DisposalSite } from 'src/disposal-sites/entities/disposal-site.entity';
import { Municipality } from 'src/municipalities/entities/municipality.entity';

@Entity('truckTrips')
export class TruckTrip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  truckId: string;

  @Column({ type: 'uuid' })
  disposalSiteId: string;

  @Column({ type: 'uuid' })
  municipalityId: string;

  // Momento en que el camión parte hacia el botadero
  @Column({ type: 'timestamptz' })
  departedAt: Date;

  // Momento en que llega al botadero
  @Column({ type: 'timestamptz', nullable: true })
  arrivedAt?: Date;

  // Momento en que termina la descarga
  @Column({ type: 'timestamptz', nullable: true })
  unloadedAt?: Date;

  // Momento en que regresa a base
  @Column({ type: 'timestamptz', nullable: true })
  returnedAt?: Date;

  // Peso total descargado en kg
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalWeight?: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  /* Relations */
  @ManyToOne(() => Truck, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'truckId' })
  truck: Truck;

  @ManyToOne(() => DisposalSite, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'disposalSiteId' })
  disposalSite: DisposalSite;

  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;
}
