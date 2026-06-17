import { Controller, Get, Param } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('accounts')
  getAccounts() {
    return this.marketingService.getAccounts();
  }

  @Get('accounts/:accountId/campaigns')
  getCampaigns(@Param('accountId') accountId: string) {
    return this.marketingService.getCampaigns(accountId);
  }

  @Get('accounts/:accountId/adsets')
  getAdSets(@Param('accountId') accountId: string) {
    return this.marketingService.getAdSets(accountId);
  }

  @Get('accounts/:accountId/ads')
  getAds(@Param('accountId') accountId: string) {
    return this.marketingService.getAds(accountId);
  }

  @Get('accounts/:accountId/adsets/:adsetId/ads')
  getAdsByAdSet(@Param('adsetId') adsetId: string) {
    return this.marketingService.getAdsByAdSet(adsetId);
  }
}
