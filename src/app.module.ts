import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './core/auth/auth.module';
import { KeysModule } from './core/keys/keys.module';
import { MarketingModule } from './core/marketing/marketing.module';
import { UserModule } from './core/user/user.module';
import { dataSource } from './shared/config/database.source';
import { jwtConfig } from './shared/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [jwtConfig] }),
    TypeOrmModule.forRoot(dataSource.options),
    AuthModule,
    UserModule,
    KeysModule,
    MarketingModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: JwtAuthGuard }],
})
export class AppModule {}
