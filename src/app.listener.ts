import { UserEntity } from './users/entities/user.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EntityRepository } from '@mikro-orm/postgresql';

export class MyEvent {
  constructor(readonly message: string) {}
}

@Injectable()
export class AppAsyncService {
  doSomething(input: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('inside promise');
        resolve('caca' + input);
      }, 1000);
    });
  }
}

@Injectable()
export class AppListener {
  constructor(
    @InjectRepository(UserEntity)
    private repo: EntityRepository<UserEntity>,
  ) {}

  @OnEvent('test')
  public async onTestEvent(event: MyEvent) {
    console.log('before listener', event);
    const s = await this.repo.findAll();
    console.log('rsult', s);
    console.log('after listener');
  }
}
