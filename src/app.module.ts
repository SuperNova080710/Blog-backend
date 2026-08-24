import { Module } from "@nestjs/common";
import { HealthCheckModule } from "./modules/health-check/health-check.module";
import { ConfigModule } from "@nestjs/config";
import * as Joi from 'joi';

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
        })

        }), 
        HealthCheckModule,
    ],
})
export class AppModule {}