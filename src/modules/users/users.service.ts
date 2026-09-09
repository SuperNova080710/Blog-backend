import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UserEntity } from "../../entities/user.entity";
import { Repository } from "typeorm";

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepository: Repository<UserEntity>,
    ) {}

    async findByEmail(email: string): Promise<UserEntity | null> {
        return this.userRepository.findOne({
            where: { email },
        });
    }

    async findById(id: number): Promise<UserEntity | null> {
        return this.userRepository.findOne({
            where: { id },
        });
    }

    async create(email: string, password: string): Promise<UserEntity> {
        const user = this.userRepository.create({
            email,
            password,
        });

        return this.userRepository.save(user);
    }
}