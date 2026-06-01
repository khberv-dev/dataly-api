import { Controller, Get } from '@nestjs/common';
import dayjs from 'dayjs';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      ok: true,
      timestamp: dayjs(),
    };
  }
}
