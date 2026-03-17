import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginationResult } from '../../shared/repositories/pagination.repository';
import { NotFoundException } from '@nestjs/common';

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
        'username',
        'fullname',
        'nickname',
        'studentId',
        'avatar',
        'role',
        'spinCount',
        'gloveCount',
        'wateringCanCount',
        'shieldCount',
        'createdAt',
        'updatedAt',
        'referralCode',
        'invitedByCode',
      ],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Tạo mã mời 4 ký tự (chữ + số) và gán cho user nếu chưa có
  async generateReferralCode(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.referralCode) return user; // Đã có mã mời

    // Sinh mã 4 ký tự, tránh trùng
    let code: string;
    let exists = true;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do {
      code = Array.from(
        { length: 4 },
        () => charset[Math.floor(Math.random() * charset.length)],
      ).join('');
      exists = !!(await this.userRepository.findOne({
        where: { referralCode: code },
      }));
    } while (exists);

    user.referralCode = code;
    await this.userRepository.save(user);
    return user;
  }

  async findAll(
    paginationDto: PaginationDto,
    search?: string,
  ): Promise<PaginationResult<User>> {
    // ...existing code...
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const where = search
      ? [
          { fullname: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
          { username: ILike(`%${search}%`) },
          { nickname: ILike(`%${search}%`) },
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
        'username',
        'fullname',
        'nickname',
        'studentId',
        'avatar',
        'role',
        'createdAt',
      ],
    });

    return new PaginationResult<User>({
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    return this.findById(id);
  }
}
