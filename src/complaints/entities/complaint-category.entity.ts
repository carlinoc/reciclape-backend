import { Column, CreateDateColumn, Entity, ManyToOne, JoinColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Municipality } from 'src/municipalities/entities/municipality.entity';

@Entity('complaintCategories')
export class ComplaintCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority: string | null;  // LOW | MEDIUM | HIGH

  @Column({ type: 'uuid' })
  municipalityId: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // RELACIONES
  @ManyToOne(() => Municipality)
  @JoinColumn({ name: 'municipalityId' })
  municipality: Municipality;
}
