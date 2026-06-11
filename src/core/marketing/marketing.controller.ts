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
}
