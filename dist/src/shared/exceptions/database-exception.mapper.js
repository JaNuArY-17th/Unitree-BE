"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseExceptionMapper = void 0;
const common_1 = require("@nestjs/common");
class DatabaseExceptionMapper {
    static map(error, entity = 'Record') {
        switch (error.code) {
            case '23505':
                throw new common_1.ConflictException(`${entity} already exists with the same unique field.`);
            case '23503':
                throw new common_1.BadRequestException(`${entity} references a non-existent foreign key.`);
            case '23502':
                throw new common_1.BadRequestException(`${entity} contains a required field missing value.`);
            case '23514':
                throw new common_1.BadRequestException(`${entity} contains invalid data that violates business rules.`);
            case '22P02':
                throw new common_1.BadRequestException(`Invalid input syntax for ${entity}. Please check the data format.`);
            case '40P01':
                throw new common_1.InternalServerErrorException(`Deadlock detected while accessing ${entity}. Please retry the operation.`);
            case '42703':
                throw new common_1.InternalServerErrorException(`Column referenced in ${entity} does not exist.`);
            case '42P01':
                throw new common_1.InternalServerErrorException(`Table for ${entity} does not exist.`);
            default:
                throw new common_1.InternalServerErrorException(error.message || `Database error occurred with ${entity}.`);
        }
    }
}
exports.DatabaseExceptionMapper = DatabaseExceptionMapper;
//# sourceMappingURL=database-exception.mapper.js.map