import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { PostEntity } from "./post.entity";


@Entity("users")
export class UserEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column({ select: false })
    password!: string;

    @OneToMany(() => PostEntity, (post) => post.author)
    posts!: PostEntity[];
}