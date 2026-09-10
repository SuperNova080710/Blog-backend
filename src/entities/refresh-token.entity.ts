import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserEntity } from "./user.entity";

@Entity("refresh_tokens")
export class RefreshTokenEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    userId!: number;

    @Column()
    tokenHash!: string;

    @Column()
    expiresAt!: Date;

    @CreateDateColumn()
    createdAt!: Date;

    @Column({ type: "timestamp", nullable: true })
    revokedAt!: Date | null;

    @ManyToOne(() => UserEntity, (user) => user.refreshTokens, {
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "userId" })
    user!: UserEntity;
}