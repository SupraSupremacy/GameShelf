import type { GameStatus, ProviderId } from '@gameshelf/shared'

export interface SeedEntry {
  slug: string
  platform: ProviderId
  status: GameStatus
  pricePaid: number | null
  acquiredAt: string
  playtimeMinutes: number
}

/** Usuario casual: pocos juegos, plataformas mezcladas. */
export const CASUAL: SeedEntry[] = [
  { slug: 'hollow-knight', platform: 'steam', status: 'finished', pricePaid: 1990, acquiredAt: '2023-02-10', playtimeMinutes: 1140 },
  { slug: 'stardew-valley', platform: 'steam', status: 'playing', pricePaid: 1999, acquiredAt: '2023-06-01', playtimeMinutes: 3260 },
  { slug: 'celeste', platform: 'gog', status: 'finished', pricePaid: 1199, acquiredAt: '2022-11-20', playtimeMinutes: 870 },
  { slug: 'hades', platform: 'steam', status: 'finished', pricePaid: 1990, acquiredAt: '2022-04-15', playtimeMinutes: 1420 },
  { slug: 'disco-elysium', platform: 'epic', status: 'playing', pricePaid: 2499, acquiredAt: '2024-01-05', playtimeMinutes: 610 },
  { slug: 'factorio', platform: 'gog', status: 'playing', pricePaid: 2499, acquiredAt: '2024-03-12', playtimeMinutes: 2240 },
]