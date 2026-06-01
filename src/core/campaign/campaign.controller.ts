import { Controller, Get, Param, Post } from '@nestjs/common';
import { CampaignService } from './campaign.service';

@Controller('ad-accounts/:adAccountId/campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Post('sync')
  sync(@Param('adAccountId') adAccountId: string) {
    return this.campaignService.sync(adAccountId);
  }

  @Get()
  findAll(@Param('adAccountId') adAccountId: string) {
    return this.campaignService.findAll(adAccountId);
  }

  @Get(':id')
  findOne(@Param('adAccountId') adAccountId: string, @Param('id') id: string) {
    return this.campaignService.findOne(adAccountId, id);
  }
}
