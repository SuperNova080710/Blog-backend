import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { UsersService } from "../users/users.service";
import { SignupDto } from "./dto/signup.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
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

        const user = await this.usersService.findByEmail(email);

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

        return {
            id: user.id,
            email: user.email,
        };
    }
}