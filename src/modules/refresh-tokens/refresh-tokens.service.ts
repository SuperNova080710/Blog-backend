import { Injectable } from "@nestjs/common";
import { RefreshTokenEntity } from "../../entities/refresh-token.entity";
import { IsNull, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class RefreshTokensService {
    constructor(
        @InjectRepository(RefreshTokenEntity)
        private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
    ) {}

    async create(
        userId: number,
        tokenHash: string,
        expiresAt: Date,
    ): Promise<RefreshTokenEntity> {
        const refreshToken = this.refreshTokenRepository.create({
            userId,
            tokenHash,
            expiresAt,
        });

        return this.refreshTokenRepository.save(refreshToken);
    }

    async findActiveByUserId(
        userId: number,
    ): Promise<RefreshTokenEntity[]> {
        return this.refreshTokenRepository.find({
            where: {
                userId,
                revokedAt: IsNull(),
            },
        });
    }
}