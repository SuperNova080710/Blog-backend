import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../../entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostEntity)
        private readonly postRepository: Repository<PostEntity>,
    ) {}

    async create(createPostDto: CreatePostDto): Promise<PostEntity> {
        const post = this.postRepository.create(createPostDto);

        return this.postRepository.save(post);
    }

    async findAll(page: number, limit: number) {
        const skip = (page -1) * limit;

        const [posts, total] = await this.postRepository.findAndCount({
            order: {
                createdAt: "DESC",
            },
            skip,
            take: limit,
        });

        return {
            data: posts,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: number): Promise<PostEntity> {
        const post = await this.postRepository.findOne({
            where: {
                id,
            },
        });

        if (!post) {
            throw new NotFoundException("Post not found");
        }

        return post;
    }

    async update(id: number, updatePostDto: UpdatePostDto): Promise<PostEntity> {
        const post = await this.findOne(id);

        Object.assign(post, updatePostDto);

        return this.postRepository.save(post);
    }
}
