import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique
} from 'typeorm';
import { Collection } from './collection.entity';
import { RecyclingType } from 'src/recycling-type/entities/recycling-type.entity';

@Entity('collectionItems')
@Unique(['collectionId', 'recyclingTypeId'])
export class CollectionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  collectionId: string;

  @Column('uuid')
  recyclingTypeId: string;

  @Column('int')
  quantity: number;

  @Column('int')
  pointsEarned: number;

  @ManyToOne(() => Collection, (collection) => collection.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'collectionId' })
  collection: Collection;

  //RELACION CON RECYCLINGTYPE
  @ManyToOne(() => RecyclingType, (rt) => rt.collectionItems)
  @JoinColumn({ name: 'recyclingTypeId' })
  recyclingType: RecyclingType;

}
