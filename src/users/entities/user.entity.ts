import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, OneToOne, OneToMany, UpdateDateColumn } from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';
import { Address } from './address.entity';
import { OperatorProfile } from './operator-profile.entity';
import { Collection } from 'src/collections/entities/collection.entity';
import { Voucher } from 'src/vouchers/entities/voucher.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ type: 'citext', unique: true })
  email: string;

  @Column({ length: 255, select: false })
  password: string;

  @Column()
  userType: string;

  @Column({ length: 20, nullable: true })
  phone?: string;

  @Column({ length: 12, nullable: true, unique: true })
  dni?: string;

  // Rol dentro del tipo ADMIN: SUPER_ADMIN (acceso total) | ADMIN (gestión operativa)
  // null para NEIGHBOR y OPERATOR — solo aplica a usuarios con userType = ADMIN
  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  adminRole?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  archivedAt: Date;

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ type: 'text', nullable: true })
  fcmToken?: string | null;

  @Column({ type: 'varchar', nullable: true })
  device?: string;

  // RELACIÓN CON MUNICIPALIDAD
  @ManyToOne(() => Municipality, (m) => m.user)
  @JoinColumn({ name: 'municipalityId' }) // Vincula la columna física con la relación
  municipality: Municipality;

  // RELACIÓN CON DIRECCIÓN
  // Un usuario tiene una dirección (especialmente para vecinos)
  @OneToOne(() => Address, (address) => address.user)
  address: Address;

  // RELACIÓN CON PERFIL DE OPERADOR
  @OneToOne(() => OperatorProfile, (operatorProfile) => operatorProfile.user)
  operatorProfile: OperatorProfile;

  // RELACIÓN CON COLLECTIONS
  // Un usuario tiene muchas colecciones
  @OneToMany(() => Collection, (collection) => collection.user)
  collections: Collection[];

  // RELACIÓN CON COLLECTIONS COMO OPERADOR
  @OneToMany(() => Collection, (collection) => collection.operatorUser)
  operatedCollections: Collection[];

  // RELACIÓN CON VOUCHERS
  // Un usuario tiene muchos vouchers
  @OneToMany(() => Voucher, (voucher) => voucher.user)
  vouchers: Voucher[];
  
  // RELACIÓN CON VOUCHERS COMO issuedByUserId
  @OneToMany(() => Voucher, (voucher) => voucher.issuedByUser)
  issuedVouchers: Voucher[];
  
}
