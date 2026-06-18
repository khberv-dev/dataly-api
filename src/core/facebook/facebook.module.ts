import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseProxyConfig } from '../../shared/utils/proxy.util';
import { FacebookService } from './facebook.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        proxy: parseProxyConfig(config.get<string>('PROXY_URL')),
      }),
    }),
  ],
  providers: [FacebookService],
  exports: [FacebookService],
})
export class FacebookModule {}
