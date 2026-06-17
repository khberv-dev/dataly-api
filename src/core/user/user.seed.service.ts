import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';

@Injectable()
export class UserSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(UserSeedService.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (await this.userService.hasAnyUsers()) return;

    const name = this.configService.get<string>('INIT_USER_NAME');
    const email = this.configService.get<string>('INIT_USER_EMAIL');
    const password = this.configService.get<string>('INIT_USER_PASSWORD');

    if (!name || !email || !password) {
      this.logger.warn('No users in DB and INIT_USER_* env vars are not set — skipping seed');
      return;
    }

    await this.userService.create(name, email, password);
    this.logger.log(`Initial user created: ${email}`);
  }
}
