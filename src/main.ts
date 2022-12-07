import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyStatic from '@fastify/static';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { UploadOptions } from 'graphql-upload';
import mercuriusUpload from 'mercurius-upload';
import { Logger } from 'nestjs-pino';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ disableRequestLogging: true }),
  );
  app.useLogger(app.get(Logger));
  const configService = app.get(ConfigService);
  const testing = configService.get<boolean>('testing');
  app.register(fastifyCors as any, {
    credentials: true,
    origin: configService.get<string>('url'),
  });
  app.register(fastifyCookie as any, {
    secret: configService.get<string>('COOKIE_SECRET'),
  });
  app.register(fastifyCsrf as any, { cookieOpts: { signed: true } });
  app.register(
    mercuriusUpload as any,
    configService.get<UploadOptions>('upload'),
  );
  app.register(fastifyStatic as any, {
    root: join(__dirname, '..', 'public'),
    decorateReply: !testing,
  });
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(
    1234,
    testing ? '127.0.0.1' : '0.0.0.0', // because of nginx
  );
  console.log('Server running on port ' + 1234);
  console.log('Server running on url ' + testing ? '127.0.0.1' : '0.0.0.0');
}

bootstrap();
