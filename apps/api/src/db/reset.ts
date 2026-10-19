import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { env } from '../config/env'

/**
 * Borra el archivo de base de datos para empezar de cero.
 * Se usa antes de `db:seed` en desarrollo.
 */
const target = resolve(process.cwd(), env.DATABASE_URL.replace(/^file:/, ''))

for (const suffix of ['', '-wal', '-shm', '-journal']) {
  const file = target + suffix
  if (existsSync(file)) {
    rmSync(file, { force: true })
    console.log('borrado:', file)
  }
}

console.log('Base de datos reiniciada.')