import { Injectable } from "@nestjs/common";

@Injectable()
export class HealthCheckService {
    constructor() {
        console.log('HealthCheckService Instants created');
    }

    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}