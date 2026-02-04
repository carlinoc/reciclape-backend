import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('userType')
export class UserType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 50 })
  typeUser: string;
}
