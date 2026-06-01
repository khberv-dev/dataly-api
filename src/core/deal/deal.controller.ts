import { Controller, Get, Param, Post } from '@nestjs/common';
import { DealService } from './deal.service';

@Controller('deals')
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Post('sync')
  sync() {
    return this.dealService.sync();
  }

  @Get()
  findAll() {
    return this.dealService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dealService.findOne(id);
  }
}
