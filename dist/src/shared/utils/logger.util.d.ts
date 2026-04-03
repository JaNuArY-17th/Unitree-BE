import { Logger as NestLogger } from '@nestjs/common';
export declare class Logger {
    private static instance;
    static getInstance(context?: string): NestLogger;
    static log(message: string, context?: string): void;
    static error(message: string, trace?: string, context?: string): void;
    static warn(message: string, context?: string): void;
    static debug(message: string, context?: string): void;
    static verbose(message: string, context?: string): void;
}
