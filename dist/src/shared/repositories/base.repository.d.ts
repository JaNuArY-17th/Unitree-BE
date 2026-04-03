import { DeepPartial, DeleteResult, FindOneOptions, ObjectLiteral, Repository, UpdateResult, DataSource, EntityTarget, FindManyOptions, FindOptionsOrder, FindOptionsRelations, FindOptionsWhere } from 'typeorm';
import { PaginationResult } from './pagination.repository';
import { PaginationDto } from '../dto/pagination.dto';
export declare class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
    private readonly entityName;
    constructor(entityName: string, entityTarget: EntityTarget<T>, dataSource: DataSource);
    createEntity(entity: DeepPartial<T>): Promise<T>;
    createMultipleEntities(entities: DeepPartial<T>[]): Promise<T[]>;
    findOneEntity(options: FindOneOptions<T>): Promise<T | null>;
    updateEntity(id: string, entity: DeepPartial<T>): Promise<UpdateResult>;
    deleteEntity(id: string): Promise<DeleteResult>;
    findAllEntities(options?: FindManyOptions<T>): Promise<T[]>;
    paginateEntities(paginationDto: PaginationDto, whereConditions?: FindOptionsWhere<T> | FindOptionsWhere<T>[], relations?: FindOptionsRelations<T>, orderBy?: FindOptionsOrder<T>): Promise<PaginationResult<T>>;
}
