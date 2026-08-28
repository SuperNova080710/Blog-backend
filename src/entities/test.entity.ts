import { 
    Column, 
    CreateDateColumn, 
    Entity, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn 
} from "typeorm";

@Entity()
export class TestEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}