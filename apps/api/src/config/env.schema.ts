import { z } from 'zod'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().default('file:./data/gameshelf.db'),
  SESSION_SECRET: z.string().optional(),
  DEMO_MODE: z.enum(['true', 'false']).default('true'),
  PRICES_SOURCE: z.enum(['auto', 'itad', 'mock']).default('auto'),
  DEFAULT_COUNTRY: z.string().length(2).default('CL'),
  DEFAULT_CURRENCY: z.string().length(3).default('CLP'),
  ITAD_API_KEY: z.string().optional(),
  ITAD_API_BASE: z.string().url().default('https://api.isthereanydeal.com'),
  STEAM_API_KEY: z.string().optional(),
  GOG_CLIENT_ID: z.string().optional(),
  PORT: z.coerce.number().int().default(3000),
  HOST: z.string().default('0.0.0.0'),
})

export type Env = z.infer<typeof EnvSchema>