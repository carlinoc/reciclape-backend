import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ubigeoProvinces' })
export class Province {
  @PrimaryColumn({ type: 'varchar', length: 4 })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 2 })
  departmentId: string;
}
