import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor';

@Controller('posts')
@UseInterceptors(ResponseInterceptor)
export class PostsController {
    constructor(private readonly postsService: PostsService) {}

    @Post()
    create(@Body() createPostDto: CreatePostDto) {
        return this.postsService.create(createPostDto);
    }

    @Get()
    findAll(@Query() query: GetPostsDto) {
        return this.postsService.findAll(query.page, query.limit);
    }

    @Get(":id")
    findOne(@Param("id", ParseIntPipe) id: number) {
        return this.postsService.findOne(id);
    }

    @Patch(":id")
    update(
        @Param("id", ParseIntPipe) id: number,
        @Body() updatePostDto: UpdatePostDto,
    ) {
        return this.postsService.update(id, updatePostDto);
    }

    @Delete(":id")
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param("id", ParseIntPipe) id: number) {
        await this.postsService.remove(id);

        // return {
        //     message: "Post deleted successfully",
        // }
    }
}
