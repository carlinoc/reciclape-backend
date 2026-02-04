import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Province } from '../../provinces/entities/province.entity';

@Entity({ name: 'ubigeoDistricts' })
export class District {
  @PrimaryColumn({ type: 'varchar', length: 6 })
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 4 })
  provinceId: string;

  @ManyToOne(() => Province)
  @JoinColumn({ name: 'provinceId' })
  province: Province;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isArchived: boolean;

  @Column({ nullable: true })
  archivedAt: Date;
}