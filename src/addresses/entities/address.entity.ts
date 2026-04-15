import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Zone } from 'src/zones/entities/zones.entity';
import { User } from 'src/users/entities/user.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  street: string;

  @Column({ length: 50, nullable: true })
  number?: string;

  @Column({ length: 50, nullable: true })
  apartment?: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location?: {
    type: 'Point';
    coordinates: number[];
  };

  @Column()
  zoneId: string;

  @ManyToOne(() => Zone)
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;

  @Column({ type: 'varchar', nullable: true })
  qrCode?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ length: 6 })
  districtId: string;

  @Column()
  userId: string;

  // null = usar modo proximidad (200m). 5, 10 o 15 = avisar X minutos antes según velocidad del camión
  @Column({ type: 'int', nullable: true })
  notifyBefore?: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
