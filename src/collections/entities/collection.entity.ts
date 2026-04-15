import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { CollectionItem } from './collection-item.entity';
import { PointsTransaction } from './points-transaction.entity';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { User } from 'src/users/entities/user.entity';
import { Truck } from 'src/trucks/entities/truck.entity';
import { VerificationMethod } from '../enums/verification-method.enum';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('uuid', { nullable: true })
  operatorUserId: string;

  @Column('uuid')
  truckId: string;

  @Column('uuid')
  municipalityId: string;
  
  @Column('int')
  pointsAwarded: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @Column({ type: 'varchar', length: 20 })
  verificationMethod: VerificationMethod;

  @OneToMany(() => CollectionItem, (item) => item.collection, { cascade: true })
  items: CollectionItem[];

  @OneToMany(() => PointsTransaction, (tx) => tx.collection)
  transactions: PointsTransaction[];

  //RELACION CON MUNICIPALIDAD
  @ManyToOne(() => Municipality, (m) => m.collection)
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;

  //RELACION CON USUARIO
  @ManyToOne(() => User, (u) => u.collections)
  @JoinColumn({ name: 'userId' })
  user: User;

  //RELACION CON USUARIO OPERADOR
  @ManyToOne(() => User, (u) => u.operatedCollections)
  @JoinColumn({ name: 'operatorUserId' })
  operatorUser: User;

  //RELACION CON TRUCK
  @ManyToOne(() => Truck, (t) => t.collections)
  @JoinColumn({ name: 'truckId' })
  truck: Truck;
}
