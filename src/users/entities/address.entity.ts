import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Zone } from 'src/zones/entities/zones.entity';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  street: string;

  @Column({ nullable: true })
  number?: string;

  @Column({ nullable: true })
  apartment?: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };

  @Column({ type: 'uuid' })
  zoneId: string;

  @Column({ type: 'char', length: 6 })
  districtId: string;

  @Column({ type: 'uuid' })
  userId: string;

  // RELACIÓN CON USUARIO
  @OneToOne(() => User, (user) => user.address)
  @JoinColumn({ name: 'userId' })
  user: User;

  // RELACIÓN CON ZONA
  @ManyToOne(() => Zone)
  @JoinColumn({ name: 'zoneId' })
  zone: Zone;
}
