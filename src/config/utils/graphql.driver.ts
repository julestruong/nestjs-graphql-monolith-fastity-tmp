import { MercuriusDriver } from '@nestjs/mercurius';

import { FastifyInstance } from 'fastify';
import { printSchema } from 'graphql';
import mercurius from 'mercurius';
import { MercuriusExtendedDriverConfig } from '../interfaces/mercurius-extended-driver-config.interface';
import { addPlugins } from './add-plugins.util';

export class GraphQLDriver extends MercuriusDriver {
  public async start(
    mercuriusOptions: MercuriusExtendedDriverConfig,
  ): Promise<void> {
    const options =
      await this.graphQlFactory.mergeWithSchema<MercuriusExtendedDriverConfig>(
        mercuriusOptions,
      );

    if (options.definitions && options.definitions.path) {
      await this.graphQlFactory.generateDefinitions(
        printSchema(options.schema),
        options,
      );
    }

    const httpAdapter = this.httpAdapterHost.httpAdapter;
    const platformName = httpAdapter.getType();

    if (platformName !== 'fastify') {
      throw new Error(`No support for current HttpAdapter: ${platformName}`);
    }
    const app = httpAdapter.getInstance<FastifyInstance>();
    const plugins = options.plugins;
    delete options.plugins;
    await app.register(mercurius as any, {
      ...options,
    });

    await addPlugins(app, plugins);

    console.log(
      'HASCONTENTTYPEPARSER MULTIPART',
      app.hasContentTypeParser('multipart'),
    );
  }
}
