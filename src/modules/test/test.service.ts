import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { TestEntity } from "../../entities/test.entity";
import { Repository } from "typeorm";

@Injectable()
export class TestService {
    constructor(
        @InjectRepository(TestEntity)
        private readonly testRepository: Repository<TestEntity>,
    ) {}

    // data create
    async create(name: string): Promise<TestEntity> {
        const test = this.testRepository.create({ name });
        return this.testRepository.save(test);
    }

    // all data check
    async findAll(): Promise<TestEntity[]> {
        return this.testRepository.find({
            order: { id: 'ASC' },
        });
    }
}