import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AmoCrmService } from './amocrm.service';

@Module({
  imports: [HttpModule],
  providers: [AmoCrmService],
  exports: [AmoCrmService],
})
export class AmoCrmModule {}
