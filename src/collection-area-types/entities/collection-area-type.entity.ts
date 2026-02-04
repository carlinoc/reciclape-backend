import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('collectionAreaTypes')
export class CollectionAreaType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ default: false })
    isArchived: boolean;

    @Column({ nullable: true })
    archivedAt: Date;
}