import { Truck } from 'src/trucks/entities/truck.entity';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';

@Entity('truckPositions')
export class TruckPosition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  truckId: string;
  
  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
  };

  @Column({ type: 'float', nullable: true })
  speed: number;

  @Column({ type: 'float', nullable: true })
  heading: number; // Dirección en grados (0-360)

  @Column({ type: 'float', nullable: true })
  accuracy: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'timestamp' })
  timestamp: Date;

  @ManyToOne(() => Truck)
  @JoinColumn({ name: 'truckId' })
  truck: Truck;
}
