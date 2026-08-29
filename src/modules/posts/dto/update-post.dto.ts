import { IsNotEmpty, IsOptional, IsString, Length, MinLength } from "class-validator";

export class UpdatePostDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @Length(1, 200)
    title?: string;

    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MinLength(1)
    content?: string;
}