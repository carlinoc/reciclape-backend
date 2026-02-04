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

  @Column({ nullable: true })
  municipalityType: string;

  @Column({ nullable: true, type: 'text' })
  address: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  mayorName: string;

  @Column({ nullable: true, type: 'text' })
  hoursOfOperation: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
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

