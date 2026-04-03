"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const typeorm_1 = require("typeorm");
const database_exception_mapper_1 = require("../exceptions/database-exception.mapper");
const pagination_repository_1 = require("./pagination.repository");
class BaseRepository extends typeorm_1.Repository {
    entityName;
    constructor(entityName, entityTarget, dataSource) {
        super(entityTarget, dataSource.createEntityManager());
        this.entityName = entityName;
    }
    async createEntity(entity) {
        try {
            return await this.save(entity);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async createMultipleEntities(entities) {
        try {
            return await this.save(entities);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async findOneEntity(options) {
        try {
            return await this.findOne(options);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async updateEntity(id, entity) {
        try {
            return await this.update(id, entity);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async deleteEntity(id) {
        try {
            return await this.delete(id);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async findAllEntities(options) {
        try {
            return await this.find(options);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
    async paginateEntities(paginationDto, whereConditions, relations, orderBy) {
        try {
            return await (0, pagination_repository_1.paginate)(this, paginationDto, whereConditions, relations, orderBy);
        }
        catch (error) {
            database_exception_mapper_1.DatabaseExceptionMapper.map(error, this.entityName);
        }
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=base.repository.js.map