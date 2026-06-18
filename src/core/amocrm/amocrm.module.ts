import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseProxyConfig } from '../../shared/utils/proxy.util';
import { AmoCrmService } from './amocrm.service';

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
  providers: [AmoCrmService],
  exports: [AmoCrmService],
})
export class AmoCrmModule {}
