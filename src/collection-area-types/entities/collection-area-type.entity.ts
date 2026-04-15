import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('collectionAreaTypes')
export class CollectionAreaType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: 'int', default: 2 })
    defaultVisitsPerWeek: number;

    @Column({ default: false })
    requiresDailyCollection: boolean;

    @Column({ default: false })
    isArchived: boolean;

    @Column({ type: 'varchar', nullable: true })
    archivedAt: Date;
}