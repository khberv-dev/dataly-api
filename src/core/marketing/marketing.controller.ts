import { Controller, Get, Param, Query } from '@nestjs/common';
import { MarketingService } from './marketing.service';

@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get('accounts')
  getAccounts() {
    return this.marketingService.getAccounts();
  }

  @Get('accounts/:accountId/campaigns')
  getCampaigns(
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketingService.getCampaigns(accountId, from, to);
  }

  @Get('accounts/:accountId/adsets')
  getAdSets(
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketingService.getAdSets(accountId, from, to);
  }

  @Get('accounts/:accountId/ads')
  getAds(
    @Param('accountId') accountId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketingService.getAds(accountId, from, to);
  }

  @Get('accounts/:accountId/adsets/:adsetId/ads')
  getAdsByAdSet(
    @Param('adsetId') adsetId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.marketingService.getAdsByAdSet(adsetId, from, to);
  }
}
