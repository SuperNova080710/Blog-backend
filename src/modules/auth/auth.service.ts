import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtService } from "@nestjs/jwt";
import { RefreshTokensService } from "../refresh-tokens/refresh-tokens.service";
import { ConfigService } from "@nestjs/config";

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
}