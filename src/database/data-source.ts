import "dotenv/config";
import { DataSource } from "typeorm";
import { TestEntity } from "../entities/test.entity";
import { PostEntity } from "../entities/post.entity";
import { UserEntity } from "../entities/user.entity";

export default new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,

    entities: [TestEntity, PostEntity, UserEntity],
    migrations: ["src/migrations/*.ts"],
});