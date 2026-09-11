import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_ACCESS_SECRET")!,
        });

        console.log("JwtStrategy initialized");
    }

    async validate(payload: { sub: number; email: string }) {
        const user = await this.usersService.findByEmail(payload.email);

        if(!user) {
            throw new UnauthorizedException(
                "Can not find authorized user.",
            );
        }

        return {
            id: user.id,
            email: user.email,
        }
    }
}