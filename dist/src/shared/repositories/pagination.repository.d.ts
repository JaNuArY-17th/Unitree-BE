import { FindOptionsOrder, FindOptionsRelations, FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';
export declare class PaginationResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    constructor(partial: Partial<PaginationResult<T>>);
}
export declare function paginate<T extends ObjectLiteral>(repository: Repository<T>, paginationDto: PaginationDto, whereConditions?: FindOptionsWhere<T> | FindOptionsWhere<T>[], relations?: FindOptionsRelations<T>, orderBy?: FindOptionsOrder<T>): Promise<PaginationResult<T>>;
