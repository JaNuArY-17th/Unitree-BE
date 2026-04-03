"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaginationResult = void 0;
exports.paginate = paginate;
class PaginationResult {
    data;
    total;
    page;
    limit;
    total_pages;
    constructor(partial) {
        Object.assign(this, partial);
    }
}
exports.PaginationResult = PaginationResult;
async function paginate(repository, paginationDto, whereConditions, relations, orderBy) {
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
    return new PaginationResult({
        data,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
    });
}
//# sourceMappingURL=pagination.repository.js.map