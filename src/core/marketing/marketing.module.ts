import { Module } from '@nestjs/common';
import { AmoCrmModule } from '../amocrm/amocrm.module';
import { FacebookModule } from '../facebook/facebook.module';
import { KeysModule } from '../keys/keys.module';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';

@Module({
  imports: [KeysModule, FacebookModule, AmoCrmModule],
  controllers: [MarketingController],
  providers: [MarketingService],
})
export class MarketingModule {}
