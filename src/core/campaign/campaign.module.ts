import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacebookModule } from '../facebook/facebook.module';
import { AdAccountModule } from '../ad-account/ad-account.module';
import { KeysModule } from '../keys/keys.module';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';
import { CampaignEntity } from './entities/campaign.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CampaignEntity]),
    AdAccountModule,
    KeysModule,
    FacebookModule,
  ],
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {}
