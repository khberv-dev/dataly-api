import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AmoCrmModule } from '../amocrm/amocrm.module';
import { KeysModule } from '../keys/keys.module';
import { DealController } from './deal.controller';
import { DealService } from './deal.service';
import { DealEntity } from './entities/deal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DealEntity]), KeysModule, AmoCrmModule],
  controllers: [DealController],
  providers: [DealService],
  exports: [DealService],
})
export class DealModule {}
