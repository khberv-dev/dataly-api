import { Controller, Get, Param, Post } from '@nestjs/common';
import { AdAccountService } from './ad-account.service';

@Controller('ad-accounts')
export class AdAccountController {
  constructor(private readonly adAccountService: AdAccountService) {}

  @Post('sync')
  sync() {
    return this.adAccountService.sync();
  }

  @Get()
  findAll() {
    return this.adAccountService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adAccountService.findOne(id);
  }
}
