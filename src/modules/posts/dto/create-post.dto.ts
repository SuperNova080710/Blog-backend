import { IsNotEmpty, IsString, Length, MinLength } from "class-validator";

export class CreatePostDto {
    @IsString()
    @IsNotEmpty()
    @Length(1, 200)
    title!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    content!: string;
}