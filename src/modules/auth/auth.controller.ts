import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

interface AuthenticatedRequest {
    user: {
        id: number;
        email: string;
    };
}

@Controller("auth")
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post("signup")
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post("login")
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post("refresh")
    async refresh(
        @Body() refreshTokenDto: RefreshTokenDto,
    ) {
        return this.authService.refresh(
            refreshTokenDto.refreshToken,
        );
    }

    @Get("me")
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req: AuthenticatedRequest) {
        return req.user;
    }
}