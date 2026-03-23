import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from '../../shared/dto/pagination.dto';
import { PaginationResult } from '../../shared/repositories/pagination.repository';
import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  // Đếm số người đã được mời bởi user hiện tại
  async countReferredUsers(userId: string): Promise<number> {
    return this.userRepository.count({
      where: { invitedBy: { id: userId } },
    });
  }

  // Lấy danh sách user đã được mời bởi user hiện tại
  async getReferredUsers(userId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { invitedBy: { id: userId } },
    });
  }
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['student'],
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
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .innerJoinAndSelect('user.student', 'student');

    if (search) {
      qb.where(
        '(student.fullName ILIKE :search OR student.email ILIKE :search OR user.username ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    qb.orderBy('user.createdAt', 'DESC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

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
