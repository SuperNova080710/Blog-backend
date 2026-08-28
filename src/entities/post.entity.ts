import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("posts")
export class PostEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: "varchar", length: 200 })
    title!: string;

    @Column({ type: "text" })
    content!: string;

    @Column()
    createdAt!: Date;

    @Column()
    updatedAt!: Date;
}