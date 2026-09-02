import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../../entities/post.entity';
import { UserEntity } from '../../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    PostEntity,
    UserEntity,
  ])],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
