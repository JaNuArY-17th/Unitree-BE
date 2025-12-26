import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'phoneNumber',
        'fullName',
        'avatar',
        'role',
        'totalPoints',
        'availablePoints',
        'isActive',
        'isVerified',
        'referralCode',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
  ): Promise<{ data: User[]; total: number }> {
    const skip = (page - 1) * limit;
    const where = search
      ? [
          { fullName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { phoneNumber: ILike(`%${search}%`) },
        ]
      : {};

    const [data, total] = await this.userRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'phoneNumber',
        'fullName',
        'avatar',
        'role',
        'totalPoints',
        'availablePoints',
        'isActive',
        'isVerified',
        'createdAt',
      ],
    });

    return { data, total };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    return this.findById(id);
  }

  async updatePoints(
    userId: string,
    points: number,
  ): Promise<User> {
    const user = await this.findById(userId);

    user.totalPoints += points;
    user.availablePoints += points;

    await this.userRepository.save(user);

    return user;
  }
}
