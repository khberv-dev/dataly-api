import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FacebookModule } from '../facebook/facebook.module';
import { KeysModule } from '../keys/keys.module';
import { AdAccountController } from './ad-account.controller';
import { AdAccountService } from './ad-account.service';
import { AdAccountEntity } from './entities/ad-account.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AdAccountEntity]), KeysModule, FacebookModule],
  controllers: [AdAccountController],
  providers: [AdAccountService],
  exports: [AdAccountService],
})
export class AdAccountModule {}
