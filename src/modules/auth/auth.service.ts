import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";
import { ConfigService } from "@nestjs/config";
import { sourceMapsEnabled } from "node:process";
import { bytes } from "node:stream/consumers";

function getExpirationDate(expiresIn: string): Date {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if(!match) {
        throw new Error(`Invalid expiration format: ${expiresIn}`);
    }

    const value = Number(match[1]);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const milliseconds = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
    }[unit];

    return new Date(Date.now() + value * milliseconds);
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly refreshTokensService: RefreshTokensService,
        private readonly configService: ConfigService,
    ) {}

    async signup(signupDto: SignupDto) {
        const { email, password } = signupDto;

        const existingUser = await this.usersService.findByEmail(email);

        if( existingUser ) {
            throw new ConflictException("This email is already in use.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.usersService.create(
            email,
            hashedPassword,
        );

        return {
            id: user.id,
            email: user.email,
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password } = loginDto;

        const user = await this.usersService.findByEmailWithPassword(email);

        if(!user) {
            throw new UnauthorizedException(
                "Email or Password is not correct.",
            );
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password,
        );

        if(!isPasswordValid) {
            throw new UnauthorizedException(
                "Email or Password is not correct.",
            );
        }

        const accessPayload = {
            sub: user.id,
            email: user.email,
        };

        const refreshPayload = {
            sub: user.id,
        };

        const accessToken = await this.jwtService.signAsync(
            accessPayload,
        );

        const refreshToken = await this.jwtService.signAsync(
            refreshPayload,
            {
                secret: this.configService.get<string>("JWT_REFRESH_SECRET")!,
                expiresIn: this.configService.get<string>("JWT_REFRESH_EXPIRES_IN")!,
            },
        );

        const refreshTokenHash = await bcrypt.hash(
            refreshToken,
            10,
        );

        const refreshExpiresIn = this.configService.get<string>(
            "JWT_REFRESH_EXPIRES_IN",
        )!;

        const refreshExpiresAt = getExpirationDate(
            refreshExpiresIn,
        );

        await this.refreshTokensService.create(
            user.id,
            refreshTokenHash,
            refreshExpiresAt,
        );

        return {
            accessToken,
            refreshToken,
        };
    }

    async refresh(refreshToken: string) {
        let payload: { sub: number };

        try {
            payload = await this.jwtService.verifyAsync(
                refreshToken,
                {
                    secret: this.configService.get<string>(
                        "JWT_REFRESH_SECRET",
                    )!,
                },
            );
        } catch {
            throw new UnauthorizedException(
                "Refresh Token is not validated.",
            );
        }

        const userId = payload.sub;

        const user = await this.usersService.findById(userId);

        if(!user) {
            throw new UnauthorizedException(
                "Can not find user.",
            );
        }

        const refreshTokens = await this.refreshTokensService.findActiveByUserId(
            userId,
        );

        const matchedToken = await Promise.all(
            refreshTokens.map(async (storedToken) => {
                const isMatch = await bcrypt.compare(
                    refreshToken,
                    storedToken.tokenHash,
                );

                return isMatch ? storedToken : null;
            }),
        ).then((tokens) =>
            tokens.find(
                (
                    token,
                ): token is (typeof refreshTokens)[number] =>
                    token !== null,
            ),
        );

        if(!matchedToken) {
            throw new UnauthorizedException(
                "Refresh Token is not validated.",
            );
        }

        await this.refreshTokensService.revoke(
            matchedToken.id,
        );

        const accessToken = await this.jwtService.signAsync({
            sub: user.id,
            email: user.email,
        });

        const refreshTokenPayload = {
            sub: user.id,
        };

        const newRefreshToken = await this.jwtService.signAsync(
            refreshTokenPayload,
            {
                secret: this.configService.get<string>(
                    "JWT_REFRESH_SECRET",
                )!,
                expiresIn: this.configService.get<string>(
                    "JWT_REFRESH_EXPIRES_IN",
                )!,
            },
        );

        const newRefreshTokenHash = await bcrypt.hash(
            newRefreshToken,
            10,
        );

        const refreshExpiresIn = this.configService.get<string>(
            "JWT_REFRESH_EXPIRES_IN",
        )!;

        const refreshExpiresAt = getExpirationDate(refreshExpiresIn);

        await this.refreshTokensService.create(
            user.id,
            newRefreshTokenHash,
            refreshExpiresAt,
        );

        return {
            accessToken,
            refreshToken: newRefreshToken,
        };
    }

    async logout(refreshToken: string): Promise<void> {
        let payload: { sub: number };

        try {
            payload = await this.jwtService.verifyAsync(
                refreshToken,
                {
                    secret: this.configService.get<string>(
                        "JWT_REFRESH_SECRET",
                    )!,
                },
            );
        } catch {
            throw new UnauthorizedException(
                "Refresh Token is not validated.",
            );
        }

        const userId = payload.sub;

        const user = await this.usersService.findById(userId);

        if(!user) {
            throw new UnauthorizedException(
                "Can not find user.",
            );
        }

        const refreshTokens = await this.refreshTokensService.findActiveByUserId(
            userId,
        );

        const matchedToken = await Promise.all(
            refreshTokens.map(async (storedToken) => {
                const isMatch = await bcrypt.compare(
                    refreshToken,
                    storedToken.tokenHash,
                );

                return isMatch ? storedToken : null;
            }),
        ).then((tokens) =>
            tokens.find(
                (
                    token,
                ): token is (typeof refreshTokens)[number] =>
                    token !== null,
            ),
        );

        if (!matchedToken) {
            throw new UnauthorizedException(
                "Refresh Token is not validated.",
            );
        }

        await this.refreshTokensService.revoke(
            matchedToken.id,
        );
    }
}