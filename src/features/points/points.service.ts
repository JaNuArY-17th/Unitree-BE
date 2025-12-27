import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Point } from '../../database/entities/point.entity';
import { PointTransactionType } from '../../shared/constants/enums.constant';

@Injectable()
export class PointsService {
  constructor(
    @InjectRepository(Point)
    private readonly pointRepository: Repository<Point>,
  ) {}

  async getPointsHistory(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: Point[]; total: number }> {
    const skip = (page - 1) * limit;

    const [data, total] = await this.pointRepository.findAndCount({
      where: { userId },
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  async getBalance(
    userId: string,
  ): Promise<{ totalPoints: number; availablePoints: number }> {
    const points = await this.pointRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 1,
    });

    if (points.length === 0) {
      return { totalPoints: 0, availablePoints: 0 };
    }

    return {
      totalPoints: points[0].balanceAfter,
      availablePoints: points[0].balanceAfter,
    };
  }

  async addPoints(
    userId: string,
    amount: number,
    type: PointTransactionType,
    referenceId?: string,
    description?: string,
  ): Promise<Point> {
    const currentBalance = await this.getBalance(userId);

    const point = this.pointRepository.create({
      userId,
      amount,
      type,
      referenceId,
      description,
      balanceAfter: currentBalance.availablePoints + amount,
    });

    return this.pointRepository.save(point);
  }
}
