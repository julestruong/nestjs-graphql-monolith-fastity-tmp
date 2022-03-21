import { HttpException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { RedisOptions } from 'ioredis';
import mercuriusCache, { MercuriusCacheOptions } from 'mercurius-cache';
import mqRedis from 'mqemitter-redis';
import Redis from 'ioredis';
import AltairFastify, {
  AltairFastifyPluginOptions,
} from 'altair-fastify-plugin';
import { AuthService } from '../auth/auth.service';
import { MercuriusExtendedDriverConfig } from './interfaces/mercurius-extended-driver-config.interface';
import { MercuriusDriverPlugin } from './interfaces/mercurius-driver-plugin.interface';
import { IWsParams } from './interfaces/ws-params.interface';
import { IWsCtx } from './interfaces/ws-ctx.interface';
import { IGqlCtx } from 'src/common/interfaces/gql-ctx.interface';
import { GraphQLError } from 'graphql';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {}

  private readonly testing = this.configService.get<boolean>('testing');
  private readonly redisOpt = this.configService.get<RedisOptions>('redis');

  public createGqlOptions(): MercuriusExtendedDriverConfig {
    const plugins: MercuriusDriverPlugin[] = [
      {
        plugin: mercuriusCache,
        options: {
          ttl: 60,
          all: true,
          storage: this.testing
            ? {
                type: 'memory',
                options: {
                  size: 1024,
                },
              }
            : {
                type: 'redis',
                options: {
                  client: new Redis(this.redisOpt),
                  size: 2048,
                },
              },
        } as MercuriusCacheOptions,
      },
    ];

    if (this.testing) {
      plugins.push({
        plugin: AltairFastify,
        options: {
          path: '/altair',
          baseURL: '/altair/',
          endpointURL: '/api/graphql',
        } as AltairFastifyPluginOptions,
      });
    }

    return {
      graphiql: false,
      ide: false,
      path: '/api/graphql',
      routes: true,
      subscription: {
        emitter: this.testing ? undefined : mqRedis(this.redisOpt),
        onConnect: async (info): Promise<IWsCtx | false> => {
          /**
           * NOTE: THIS TAKES A DEVICE ID THAT SHOULD BE GENERATED BY THE CLIENT
           * Since we can't access the ip address on the on connect something has
           * to come on its place.
           */
          const { authorization, deviceId }: IWsParams = info.payload;

          if (!authorization || !deviceId) return false;

          const authArr = authorization.split(' ');

          if (authArr[0] !== 'Bearer') return false;

          try {
            const [user, sessionId] = await this.authService.generateWsSession(
              authArr[1],
              deviceId,
            );
            return { user, sessionId };
          } catch (_) {
            return false;
          }
        },
        onDisconnect: async (ctx) => {
          const { sessionId, user } = ctx as IGqlCtx;

          if (!user || !sessionId) return;

          await this.authService.closeUserSession(user, sessionId);
        },
      },
      autoSchemaFile: './schema.gql',
      errorFormatter: (error) => {
        const org = error.errors[0].originalError as HttpException;
        return {
          statusCode: org.getStatus(),
          response: {
            errors: [org.getResponse() as GraphQLError],
            data: null,
          },
        };
      },
      plugins,
    };
  }
}
