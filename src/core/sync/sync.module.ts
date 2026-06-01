import { Module } from '@nestjs/common';
import { AdAccountModule } from '../ad-account/ad-account.module';
import { CampaignModule } from '../campaign/campaign.module';
import { DealModule } from '../deal/deal.module';
import { SyncScheduler } from './sync.scheduler';

@Module({
  imports: [AdAccountModule, CampaignModule, DealModule],
  providers: [SyncScheduler],
})
export class SyncModule {}
