import 'dotenv/config'
import { EnvSchema, type Env } from './env.schema'

export type AppEnv = Env & {
  isDemo: boolean
  itadConfigured: boolean
  pricesSource: 'itad' | 'mock'
}

function load(): AppEnv {
  const parsed = EnvSchema.safeParse(process.env)

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n')
    throw new Error(`Variables de entorno invalidas:\n${issues}`)
  }

  const env = parsed.data
  const itadConfigured = Boolean(env.ITAD_API_KEY)

  // Fuente efectiva de precios. "auto" cae a mock si no hay key de ITAD,
  // para que la demo nunca quede sin datos.
  let pricesSource: 'itad' | 'mock'
  if (env.PRICES_SOURCE === 'itad') {
    if (!itadConfigured) {
      throw new Error('PRICES_SOURCE=itad pero falta ITAD_API_KEY')
    }
    pricesSource = 'itad'
  } else if (env.PRICES_SOURCE === 'mock') {
    pricesSource = 'mock'
  } else {
    pricesSource = itadConfigured ? 'itad' : 'mock'
  }

  return { ...env, isDemo: env.DEMO_MODE === 'true', itadConfigured, pricesSource }
}

export const env: AppEnv = load()