import { db } from './client'
import { users, userGames } from './schema'
import { CASUAL, type SeedEntry } from './seed-users-data'
import { COLLECTOR } from './seed-collector-data'

const ACCOUNTS = [
  { id: 'demo-casual', username: 'casual', displayName: 'Jugador casual', avatarColor: '#6366f1' },
  { id: 'demo-collector', username: 'coleccionista', displayName: 'Coleccionista', avatarColor: '#f59e0b' },
] as const

async function insertEntries(userId: string, entries: SeedEntry[], gameIds: Map<string, number>) {
  for (const entry of entries) {
    const gameId = gameIds.get(entry.slug)
    if (!gameId) continue
    await db
      .insert(userGames)
      .values({
        userId,
        gameId,
        platform: entry.platform,
        status: entry.status,
        pricePaid: entry.pricePaid,
        acquiredAt: entry.acquiredAt,
        playtimeMinutes: entry.playtimeMinutes,
        source: 'api',
      })
      .onConflictDoNothing()
  }
}

export async function seedUsers(gameIds: Map<string, number>): Promise<void> {
  for (const account of ACCOUNTS) {
    await db
      .insert(users)
      .values({
        id: account.id,
        username: account.username,
        displayName: account.displayName,
        avatarColor: account.avatarColor,
        isDemo: true,
      })
      .onConflictDoNothing()
  }

  await insertEntries('demo-casual', CASUAL, gameIds)
  await insertEntries('demo-collector', COLLECTOR, gameIds)

  console.log(`Usuarios: ${ACCOUNTS.length} cuentas demo`)
}