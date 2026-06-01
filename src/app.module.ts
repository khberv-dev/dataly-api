import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AdAccountModule } from './core/ad-account/ad-account.module';
import { AuthModule } from './core/auth/auth.module';
import { CampaignModule } from './core/campaign/campaign.module';
import { DealModule } from './core/deal/deal.module';
import { KeysModule } from './core/keys/keys.module';
import { SyncModule } from './core/sync/sync.module';
import { UserModule } from './core/user/user.module';
import { jwtConfig } from './shared/config/jwt.config';
import { dataSource } from './shared/config/database.source';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
    }),
    TypeOrmModule.forRoot(dataSource.options),
    UserModule,
    AuthModule,
    KeysModule,
    AdAccountModule,
    CampaignModule,
    DealModule,
    SyncModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
