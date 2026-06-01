import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KeyEntity } from './entities/key.entity';
import { KeysController } from './keys.controller';
import { KeysService } from './keys.service';

@Module({
  imports: [TypeOrmModule.forFeature([KeyEntity])],
  controllers: [KeysController],
  providers: [KeysService],
  exports: [KeysService],
})
export class KeysModule {}
