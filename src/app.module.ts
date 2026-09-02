import { Module } from "@nestjs/common";
import { HealthCheckModule } from "./modules/health-check/health-check.module";
import { ConfigModule, ConfigService} from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from 'joi';
import { TestModule } from "./modules/test/test.module";
import { PostsModule } from './modules/posts/posts.module';

@Module({
    imports: [ConfigModule.forRoot({
        isGlobal: true,

        validationSchema: Joi.object({
            NODE_ENV: Joi.string()
            .valid('development', 'production')
            .default('development'),

            PORT: Joi.number()
            .port()
            .default(3000),
            
            DB_HOST: Joi.string()
            .required(),

            DB_PORT: Joi.number()
            .port()
            .default(5432),

            DB_USERNAME: Joi.string()
            .required(),

            DB_PASSWORD: Joi.string()
            .required(),

            DB_DATABASE: Joi.string()
            .required(),
        })

        }), 

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],

            useFactory: (configService: ConfigService) => ({
                type: "postgres",
                host: configService.get<string>("DB_HOST"),
                port: configService.get<number>("DB_PORT"),
                username: configService.get<string>("DB_USERNAME"),
                password: configService.get<string>("DB_PASSWORD"),
                database: configService.get<string>("DB_DATABASE"),

                autoLoadEntities: true,

                // Migration으로 스키마를 관리하므로 false
                synchronize: false,
            }),
        }),

        HealthCheckModule,
        TestModule,
        PostsModule,
    ],
})
export class AppModule {}