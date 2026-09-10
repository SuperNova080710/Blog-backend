import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RefreshTokenEntity } from "../../entities/refresh-token.entity";
import { Repository } from "typeorm";

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
}