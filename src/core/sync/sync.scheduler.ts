import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AdAccountService } from '../ad-account/ad-account.service';
import { CampaignService } from '../campaign/campaign.service';
import { DealService } from '../deal/deal.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    private readonly adAccountService: AdAccountService,
    private readonly campaignService: CampaignService,
    private readonly dealService: DealService,
  ) {}

  @Cron('*/3 * * * *')
  async syncAll() {
    await Promise.allSettled([this.syncFacebook(), this.syncAmoCrm()]);
  }

  private async syncFacebook() {
    try {
      await this.adAccountService.sync();
      await this.campaignService.syncAll();
    } catch (err) {
      this.logger.error(`Facebook sync failed: ${err?.message}`);
    }
  }

  private async syncAmoCrm() {
    try {
      await this.dealService.sync();
    } catch (err) {
      this.logger.error(`amoCRM sync failed: ${err?.message}`);
    }
  }
}
