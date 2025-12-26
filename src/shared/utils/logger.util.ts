import { Logger as NestLogger } from '@nestjs/common';

export class Logger {
  private static instance: NestLogger;

  static getInstance(context?: string): NestLogger {
    if (!this.instance) {
      this.instance = new NestLogger(context || 'Application');
    }
    return this.instance;
  }

  static log(message: string, context?: string): void {
    const logger = this.getInstance(context);
    logger.log(message);
  }

  static error(message: string, trace?: string, context?: string): void {
    const logger = this.getInstance(context);
    logger.error(message, trace);
  }

  static warn(message: string, context?: string): void {
    const logger = this.getInstance(context);
    logger.warn(message);
  }

  static debug(message: string, context?: string): void {
    const logger = this.getInstance(context);
    logger.debug(message);
  }

  static verbose(message: string, context?: string): void {
    const logger = this.getInstance(context);
    logger.verbose(message);
  }
}
