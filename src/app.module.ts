import { UserEntity } from './users/entities/user.entity';
import { AppAsyncService, AppListener } from './app.listener';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { AuthGuard } from './auth/guards/auth.guard';
import { CommonModule } from './common/common.module';
import { CacheConfig } from './config/cache.config';
import { config } from './config/config';
import { GqlConfigService } from './config/graphql.config';
import { MikroOrmConfig } from './config/mikroorm.config';
import { GraphQLDriver } from './config/utils/graphql.driver';
import { validationSchema } from './config/validation';
import { EmailModule } from './email/email.module';
import { UploaderModule } from './uploader/uploader.module';
import { UsersModule } from './users/users.module';
import { LoadersModule } from './loaders/loaders.module';
import { MercuriusExtendedDriverConfig } from './config/interfaces/mercurius-extended-driver-config.interface';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [config],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MikroOrmConfig,
    }),
    MikroOrmModule.forFeature([UserEntity]),
    CacheModule.registerAsync({
      isGlobal: true,
      useClass: CacheConfig,
    }),
    GraphQLModule.forRootAsync<MercuriusExtendedDriverConfig>({
      imports: [ConfigModule, AuthModule, LoadersModule],
      driver: GraphQLDriver,
      useClass: GqlConfigService,
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    EmailModule,
    UploaderModule,
    LoadersModule,
    EventEmitterModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: {},
    }),
  ],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
    AppAsyncService,
    AppListener,
  ],
  controllers: [AppController],
})
export class AppModule {}
