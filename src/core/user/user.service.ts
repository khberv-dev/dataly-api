import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { hash } from '../../shared/utils/hash.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async create(name: string, email: string, password: string): Promise<UserEntity> {
    const exists = await this.userRepository.findOneBy({ email });
    if (exists) throw new ConflictException('Email already in use');

    const user = this.userRepository.create({
      name,
      email,
      password: await hash(password),
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOneBy({ id });
  }

  async findByIdOrFail(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async hasAnyUsers(): Promise<boolean> {
    return (await this.userRepository.count()) > 0;
  }
}
