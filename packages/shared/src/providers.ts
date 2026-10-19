export const PROVIDERS = ['steam', 'epic', 'gog'] as const

export type ProviderId = (typeof PROVIDERS)[number]

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  steam: 'Steam',
  epic: 'Epic Games Store',
  gog: 'GOG',
}

export function isProviderId(value: string): value is ProviderId {
  return (PROVIDERS as readonly string[]).includes(value)
}