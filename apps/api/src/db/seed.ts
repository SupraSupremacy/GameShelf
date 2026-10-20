import { runMigrations } from './migrate-runner'
import { seedCatalog } from './seed-catalog'
import { seedUsers } from './seed-users'

/**
 * Carga datos iniciales. Idempotente: se puede correr varias veces.
 *   pnpm db:seed
 */
async function main(): Promise<void> {
  console.log('Aplicando migraciones...')
  await runMigrations()

  console.log('Sembrando catalogo...')
  const gameIds = await seedCatalog()

  console.log('Sembrando usuarios demo...')
  await seedUsers(gameIds)

  console.log('Seed completo.')
}

main().catch((error: unknown) => {
  console.error('Seed fallo:', error)
  process.exit(1)
})