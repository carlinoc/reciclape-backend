import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Municipality } from '../../municipalities/entities/municipality.entity';
import { CollectionItem } from 'src/collections/entities/collection-item.entity';

@Entity('recyclingType')
export class RecyclingType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int' })
  pointsGiven: number;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt?: Date;

  @Column({ type: 'varchar', length: 10 })
  unitType: string; //ENUM: KILOS, LITERS, METERS

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ default: false })
  isGarbage: boolean;

  @ManyToOne(() => Municipality, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  //RELACION CON COLLECTIONITEMS
  @OneToMany(() => CollectionItem, (item) => item.recyclingType)
  @JoinColumn({ name: 'recyclingTypeId' })
  collectionItems: CollectionItem[];
}
