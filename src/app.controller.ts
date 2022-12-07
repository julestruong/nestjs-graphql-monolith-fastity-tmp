import { Controller, Get, Logger, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MyEvent } from './app.listener';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { UserEntity } from './users/entities/user.entity';

// Because of nginx
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    @InjectRepository(UserEntity)
    private repo: EntityRepository<UserEntity>,
  ) {}
  private readonly port = this.configService.get<number>('port');

  @Get('/api')
  public async getInitialRoute() {
    this.logger.log('before controller');
    const users = await this.repo.findOne({ id: 1 });

    this.logger.log('users', users);
    return `Server running on ${this.port}`;
  }

  @Get('/favicon.ico')
  public getFavicon(@Res() res: FastifyReply) {
    res.sendFile('/favicon.ico');
  }
}
