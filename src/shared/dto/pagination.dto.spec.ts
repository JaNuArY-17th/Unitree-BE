import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationDto } from './pagination.dto';

describe('PaginationDto', () => {
  it('should validate default values', async () => {
    const dto = plainToInstance(PaginationDto, {});

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('should fail when page is below 1', async () => {
    const dto = plainToInstance(PaginationDto, { page: 0, limit: 10 });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'page')).toBe(true);
  });

  it('should fail when limit exceeds max', async () => {
    const dto = plainToInstance(PaginationDto, { page: 1, limit: 101 });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'limit')).toBe(true);
  });
});
