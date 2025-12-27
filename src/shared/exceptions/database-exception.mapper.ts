import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

type DbError = {
  code?: string;
  detail?: string;
  message?: string;
};

export class DatabaseExceptionMapper {
  /**
   * Map database errors to NestJS exceptions with clear entity-specific messages.
   * @param error - Database error
   * @param entity - Entity or table name
   */
  static map(error: DbError, entity: string = 'Record'): never {
    switch (error.code) {
      case '23505': // Unique violation
        throw new ConflictException(
          `${entity} already exists with the same unique field.`,
        );

      case '23503': // Foreign key violation
        throw new BadRequestException(
          `${entity} references a non-existent foreign key.`,
        );

      case '23502': // Not null violation
        throw new BadRequestException(
          `${entity} contains a required field missing value.`,
        );

      case '23514': // Check violation
        throw new BadRequestException(
          `${entity} contains invalid data that violates business rules.`,
        );

      case '22P02': // Invalid input syntax
        throw new BadRequestException(
          `Invalid input syntax for ${entity}. Please check the data format.`,
        );

      case '40P01': // Deadlock
        throw new InternalServerErrorException(
          `Deadlock detected while accessing ${entity}. Please retry the operation.`,
        );

      case '42703': // Undefined column
        throw new InternalServerErrorException(
          `Column referenced in ${entity} does not exist.`,
        );

      case '42P01': // Undefined table
        throw new InternalServerErrorException(
          `Table for ${entity} does not exist.`,
        );

      default:
        throw new InternalServerErrorException(
          error.message || `Database error occurred with ${entity}.`,
        );
    }
  }
}
