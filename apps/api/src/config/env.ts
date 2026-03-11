import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  API_PORT: z.coerce.number().default(3000),
  APP_ORIGIN: z.string().default('http://localhost:5173'),
  MYSQL_HOST: z.string().default('127.0.0.1'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_DATABASE: z.string().default('psikotest'),
  MYSQL_USER: z.string().default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  JWT_SECRET: z.string().min(16).default('replace-this-with-a-long-random-secret'),
});

const rawEnv = {
  API_PORT: process.env.PORT ?? process.env.API_PORT,
  APP_ORIGIN: process.env.APP_ORIGIN,
  MYSQL_HOST: process.env.DB_HOST ?? process.env.MYSQL_HOST,
  MYSQL_PORT: process.env.DB_PORT ?? process.env.MYSQL_PORT,
  MYSQL_DATABASE: process.env.DB_NAME ?? process.env.MYSQL_DATABASE,
  MYSQL_USER: process.env.DB_USER ?? process.env.MYSQL_USER,
  MYSQL_PASSWORD: process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,
};

export const env = envSchema.parse(rawEnv);
