import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL?.includes('render.com') ||
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  entities: [__dirname + '/entities/**/*.entity.{js,ts}'],
  migrations: [__dirname + '/migrations/**/*.{js,ts}'],
  synchronize: false,
});
