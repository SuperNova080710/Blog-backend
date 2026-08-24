import { Module } from "@nestjs/common";
import { HealthCheckModule } from "./modules/health-check/health-check.module";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule.forRoot({
        isGlobal: true,
        }), 
        HealthCheckModule,
    ],
})
export class AppModule {}