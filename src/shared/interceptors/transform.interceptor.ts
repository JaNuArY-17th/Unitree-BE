import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response as ExpressResponse } from 'express';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

interface ResponseData<T = unknown> {
  message?: string;
  data?: T;
  [key: string]: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((rawData) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<ExpressResponse>();
        const statusCode = response.statusCode;

        // If data already has success property, return as is
        if (rawData && typeof rawData === 'object' && 'success' in rawData) {
          return rawData;
        }

        // Extract message from data if it exists
        let message = '';
        let responseData: unknown = {};

        if (rawData && typeof rawData === 'object') {
          const typedData = rawData as ResponseData;

          if (typedData.message) {
            message = typedData.message;
            responseData = typedData.data !== undefined ? typedData.data : {};
          } else {
            responseData = rawData;
          }
        } else {
          responseData = rawData ?? {};
        }

        const result: Response<unknown> = {
          success: true,
          message: message || 'Request successful',
          data: responseData,
          code: statusCode,
        };

        return result;
      }),
    );
  }
}
