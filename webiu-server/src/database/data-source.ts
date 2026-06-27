import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { getSSLConfig } from './ssl.config';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: getSSLConfig(),
  entities: [__dirname + '/entities/**/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  synchronize: false,
});
