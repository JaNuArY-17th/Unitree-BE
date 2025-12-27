import {
  DeepPartial,
  DeleteResult,
  FindOneOptions,
  ObjectLiteral,
  Repository,
  UpdateResult,
  DataSource,
  EntityTarget,
  FindManyOptions,
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
} from 'typeorm';
import { DatabaseExceptionMapper } from '../exceptions/database-exception.mapper';
import { paginate, PaginationResult } from './pagination.repository';
import { PaginationDto } from '../dto/pagination.dto';

/**
 * Base repository class with automatic database exception mapping.
 * Provides standardized CRUD operations and pagination support.
 */
export class BaseRepository<T extends ObjectLiteral> extends Repository<T> {
  private readonly entityName: string;

  constructor(
    entityName: string,
    entityTarget: EntityTarget<T>,
    dataSource: DataSource,
  ) {
    super(entityTarget, dataSource.createEntityManager());
    this.entityName = entityName;
  }

  async createEntity(entity: DeepPartial<T>): Promise<T> {
    try {
      return await this.save(entity);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async createMultipleEntities(entities: DeepPartial<T>[]): Promise<T[]> {
    try {
      return await this.save(entities);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async findOneEntity(options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.findOne(options);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async updateEntity(
    id: string,
    entity: DeepPartial<T>,
  ): Promise<UpdateResult> {
    try {
      return await this.update(id, entity as any);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async deleteEntity(id: string): Promise<DeleteResult> {
    try {
      return await this.delete(id);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async findAllEntities(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.find(options);
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }

  async paginateEntities(
    paginationDto: PaginationDto,
    whereConditions?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
    relations?: FindOptionsRelations<T>,
    orderBy?: FindOptionsOrder<T>,
  ): Promise<PaginationResult<T>> {
    try {
      return await paginate<T>(
        this,
        paginationDto,
        whereConditions,
        relations,
        orderBy,
      );
    } catch (error) {
      DatabaseExceptionMapper.map(error, this.entityName);
    }
  }
}
