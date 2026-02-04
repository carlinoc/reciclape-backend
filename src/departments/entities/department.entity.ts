import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity({ name: 'ubigeoDepartments' })
export class Department {
  @PrimaryColumn({ type: 'varchar', length: 2 })
  id: string;

  @Column({ length: 100 })
  name: string;
}
