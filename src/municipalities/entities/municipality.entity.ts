import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { District } from '../../districts/entities/district.entity';
import { User } from 'src/users/entities/user.entity';
import { Collection } from 'src/collections/entities/collection.entity';

@Entity('municipalities')
export class Municipality {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  officialName: string;

  @Column()
  districtId: string;

  @ManyToOne(() => District)
  @JoinColumn({ name: 'districtId' })
  district: District;

  @Column({ type: 'varchar', nullable: true })
  municipalityType: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'varchar', nullable: true })
  website: string;

  @Column({ type: 'varchar', nullable: true })
  mayorName: string;

  @Column({ nullable: true, type: 'text' })
  hoursOfOperation: string;

  // BASE OPERATIVA
  @Column({ type: 'varchar', length: 150, nullable: true })
  operationalBaseName: string;

  // BOTADERO / RELLENO SANITARIO
  @Column({ type: 'varchar', length: 150, nullable: true })
  dumpName: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  dumpLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  dumpLongitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  operationalBaseLatitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  operationalBaseLongitude: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;

  // RELACIÓN CON USUARIO
  // Una municipalidad tiene muchos usuarios
  @OneToMany(() => User, (user) => user.municipality)
  user: User[];

  // RELACIÓN CON COLLECTIONS
  // Una municipalidad tiene muchas colecciones
  @OneToMany(() => Collection, (collection) => collection.municipality)
  collection: Collection[];

  // RELACIÓN CON VOUCHERS
  // Una municipalidad tiene muchos vouchers
  @OneToMany(() => Collection, (collection) => collection.municipality)
  vouchers: Collection[];
}

