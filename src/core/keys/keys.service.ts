import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateKeyDto } from './dto/create-key.dto';
import { UpdateKeyDto } from './dto/update-key.dto';
import { KeyEntity, KeyType } from './entities/key.entity';

@Injectable()
export class KeysService {
  constructor(
    @InjectRepository(KeyEntity)
    private readonly keyRepository: Repository<KeyEntity>,
  ) {}

  async create(dto: CreateKeyDto): Promise<KeyEntity> {
    const exists = await this.keyRepository.findOneBy({ type: dto.type });
    if (exists) throw new ConflictException(`Key of type "${dto.type}" already exists`);

    const key = this.keyRepository.create(dto);
    return this.keyRepository.save(key);
  }

  findAll(): Promise<KeyEntity[]> {
    return this.keyRepository.find();
  }

  async findOne(id: string): Promise<KeyEntity> {
    const key = await this.keyRepository.findOneBy({ id });
    if (!key) throw new NotFoundException('Key not found');
    return key;
  }

  findByType(type: KeyType): Promise<KeyEntity | null> {
    return this.keyRepository.findOneBy({ type });
  }

  async update(id: string, dto: UpdateKeyDto): Promise<KeyEntity> {
    const key = await this.findOne(id);

    if (dto.type && dto.type !== key.type) {
      const conflict = await this.keyRepository.findOneBy({ type: dto.type });
      if (conflict) throw new ConflictException(`Key of type "${dto.type}" already exists`);
    }

    Object.assign(key, dto);
    return this.keyRepository.save(key);
  }

  async remove(id: string): Promise<void> {
    const key = await this.findOne(id);
    await this.keyRepository.remove(key);
  }
}
