import "dotenv/config";
import { DataSource } from "typeorm";
import { TestEntity } from "../entities/test.entity";
import { PostEntity } from "../entities/post.entity";
import { UserEntity } from "../entities/user.entity";
import { RefreshTokenEntity } from "../entities/refresh-token.entity";

export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    entities: [
        TestEntity,
        PostEntity,
        UserEntity,
        RefreshTokenEntity,
    ],

    migrations:
        process.env.NODE_ENV === "production"
            ? [__dirname + "/../migrations/*.js"]
            : ["src/migrations/*.ts"],
});