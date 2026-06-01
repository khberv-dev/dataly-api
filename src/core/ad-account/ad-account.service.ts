import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyType } from '../keys/entities/key.entity';
import { KeysService } from '../keys/keys.service';
import { FacebookService } from '../facebook/facebook.service';
import { AdAccountEntity } from './entities/ad-account.entity';

@Injectable()
export class AdAccountService {
  constructor(
    @InjectRepository(AdAccountEntity)
    private readonly adAccountRepository: Repository<AdAccountEntity>,
    private readonly keysService: KeysService,
    private readonly facebookService: FacebookService,
  ) {}

  async sync(): Promise<AdAccountEntity[]> {
    const metaKey = await this.keysService.findByType(KeyType.META);
    if (!metaKey) throw new BadRequestException('Meta access key not configured');

    const fbAccounts = await this.facebookService.getAdAccounts(metaKey.key);

    const synced = await Promise.all(
      fbAccounts.map(async (fb) => {
        let account = await this.adAccountRepository.findOneBy({ accountId: fb.id });

        if (account) {
          account.name = fb.name;
        } else {
          account = this.adAccountRepository.create({ accountId: fb.id, name: fb.name });
        }

        return this.adAccountRepository.save(account);
      }),
    );

    return synced;
  }

  findAll(): Promise<AdAccountEntity[]> {
    return this.adAccountRepository.find();
  }

  async findOne(id: string): Promise<AdAccountEntity> {
    const account = await this.adAccountRepository.findOneBy({ id });
    if (!account) throw new NotFoundException('Ad account not found');
    return account;
  }
}
