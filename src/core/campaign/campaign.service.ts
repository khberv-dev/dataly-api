import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdAccountService } from '../ad-account/ad-account.service';
import { KeyType } from '../keys/entities/key.entity';
import { KeysService } from '../keys/keys.service';
import { FacebookService } from '../facebook/facebook.service';
import { CampaignEntity } from './entities/campaign.entity';

@Injectable()
export class CampaignService {
  constructor(
    @InjectRepository(CampaignEntity)
    private readonly campaignRepository: Repository<CampaignEntity>,
    private readonly adAccountService: AdAccountService,
    private readonly keysService: KeysService,
    private readonly facebookService: FacebookService,
  ) {}

  async sync(adAccountId: string): Promise<CampaignEntity[]> {
    const adAccount = await this.adAccountService.findOne(adAccountId);

    const metaKey = await this.keysService.findByType(KeyType.META);
    if (!metaKey) throw new BadRequestException('Meta access key not configured');

    const fbCampaigns = await this.facebookService.getCampaigns(adAccount.accountId, metaKey.key);

    return Promise.all(
      fbCampaigns.map(async (fb) => {
        let campaign = await this.campaignRepository.findOneBy({
          campaignId: fb.id,
          adAccount: { id: adAccountId },
        });

        const budget = parseInt(fb.daily_budget ?? '0') || parseInt(fb.lifetime_budget ?? '0');
        const insight = fb.insights?.data?.[0];
        const views = parseInt(insight?.impressions ?? '0');
        const clicks = parseInt(insight?.clicks ?? '0');

        if (campaign) {
          campaign.title = fb.name;
          campaign.budget = budget;
          campaign.views = views;
          campaign.clicks = clicks;
        } else {
          campaign = this.campaignRepository.create({
            campaignId: fb.id,
            title: fb.name,
            budget,
            views,
            clicks,
            adAccount: { id: adAccountId },
          });
        }

        return this.campaignRepository.save(campaign);
      }),
    );
  }

  async syncAll(): Promise<void> {
    const accounts = await this.adAccountService.findAll();
    await Promise.all(accounts.map((a) => this.sync(a.id)));
  }

  findAll(adAccountId: string): Promise<CampaignEntity[]> {
    return this.campaignRepository.findBy({ adAccount: { id: adAccountId } });
  }

  async findOne(adAccountId: string, id: string): Promise<CampaignEntity> {
    const campaign = await this.campaignRepository.findOneBy({ id, adAccount: { id: adAccountId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }
}
