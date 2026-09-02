import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators"


@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<unknown> {
        return next.handle().pipe(
            map((data: unknown) => {
                if(data === undefined || data === null) {
                    return data;
                }

                if (typeof data === "object" && "data" in data) {
                    return data;
                }

                return {
                    data,
                };
            }),
        );
    }
}