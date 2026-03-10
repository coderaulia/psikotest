import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  API_PORT: z.coerce.number().default(4000),
  APP_ORIGIN: z.string().default('http://localhost:5173'),
  MYSQL_HOST: z.string().default('127.0.0.1'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_DATABASE: z.string().default('psikotest'),
  MYSQL_USER: z.string().default('root'),
  MYSQL_PASSWORD: z.string().default(''),
  JWT_SECRET: z.string().default('change-me'),
});

export const env = envSchema.parse(process.env);
