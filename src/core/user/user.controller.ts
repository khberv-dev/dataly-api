import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserEntity } from './entities/user.entity';

@Controller('users')
export class UserController {
  @Get('me')
  getMe(@CurrentUser() user: UserEntity): UserEntity {
    return user;
  }
}
