import { runMigrations } from './migrate-runner'

console.log('Aplicando migraciones...')
runMigrations()
console.log('Migraciones aplicadas. OK')