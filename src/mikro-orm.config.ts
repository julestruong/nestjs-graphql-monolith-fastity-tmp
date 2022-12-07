import { LoadStrategy, Options } from '@mikro-orm/core';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

const config: Options = {
  type: 'postgresql',
  clientUrl: process.env.DATABASE_URL,
  entities: ['dist/**/*.entity.js', 'dist/**/*.embeddable.js'],
  entitiesTs: ['src/**/*.entity.ts', 'src/**/*.embeddable.ts'],
  metadataProvider: TsMorphMetadataProvider,
  loadStrategy: LoadStrategy.JOINED,
  logger: console.log.bind(console),
  cache: { enabled: true },
  debug: true,
  allowGlobalContext: true,
};

export default config;
