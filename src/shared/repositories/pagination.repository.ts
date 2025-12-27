import {
  FindOptionsOrder,
  FindOptionsRelations,
  FindOptionsWhere,
  ObjectLiteral,
  Repository,
} from 'typeorm';
import { PaginationDto } from '../dto/pagination.dto';

export class PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;

  constructor(partial: Partial<PaginationResult<T>>) {
    Object.assign(this, partial);
  }
}

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  paginationDto: PaginationDto,
  whereConditions?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  relations?: FindOptionsRelations<T>,
  orderBy?: FindOptionsOrder<T>,
): Promise<PaginationResult<T>> {
  const page = paginationDto.page || 1;
  const limit = paginationDto.limit || 10;

  const skip = (page - 1) * limit;
  const take = limit;

  const [data, total] = await repository.findAndCount({
    where: whereConditions,
    relations,
    order: orderBy,
    skip,
    take,
  });

  return new PaginationResult<T>({
    data,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  });
}
