import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KeyType } from '../keys/entities/key.entity';
import { KeysService } from '../keys/keys.service';
import { AmoCrmService } from '../amocrm/amocrm.service';
import { DealEntity } from './entities/deal.entity';

@Injectable()
export class DealService {
  constructor(
    @InjectRepository(DealEntity)
    private readonly dealRepository: Repository<DealEntity>,
    private readonly keysService: KeysService,
    private readonly amoCrmService: AmoCrmService,
  ) {}

  async sync(): Promise<DealEntity[]> {
    const amoKey = await this.keysService.findByType(KeyType.AMOCRM);
    if (!amoKey) throw new BadRequestException('amoCRM key not configured');

    const { domain, accessToken } = this.amoCrmService.parseKey(amoKey.key);
    const amoDeals = await this.amoCrmService.getDeals(domain, accessToken);

    const existing = await this.dealRepository.find();
    const existingMap = new Map(existing.map((d) => [d.dealId, d]));

    const toSave = amoDeals.map((amo) => {
      const deal = existingMap.get(amo.id) ?? this.dealRepository.create();
      deal.dealId = amo.id;
      deal.title = amo.name;
      deal.price = amo.price ?? 0;
      deal.statusId = amo.status_id;
      deal.pipelineId = amo.pipeline_id;
      return deal;
    });

    return this.dealRepository.save(toSave, { chunk: 100 });
  }

  findAll(): Promise<DealEntity[]> {
    return this.dealRepository.find();
  }

  async findOne(id: string): Promise<DealEntity> {
    const deal = await this.dealRepository.findOneBy({ id });
    if (!deal) throw new NotFoundException('Deal not found');
    return deal;
  }
}
