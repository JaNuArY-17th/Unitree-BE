import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EconomyLog } from '../../database/entities/economy-log.entity';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(EconomyLog)
    private readonly economyLogRepository: Repository<EconomyLog>,
  ) {}

  async getEconomyHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: EconomyLog[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.economyLogRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async addEconomyLog(
    userId: string,
    resourceType: string,
    amount: number,
    source: string,
  ): Promise<EconomyLog> {
    const log = this.economyLogRepository.create({
      userId,
      resourceType,
      amount,
      source,
    });

    return this.economyLogRepository.save(log);
  }
}
