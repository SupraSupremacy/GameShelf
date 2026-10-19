import { defineConfig, devices } from '@playwright/test'

/**
 * Prueba de humo end-to-end.
 *
 * Levanta API y web con el mismo `pnpm dev` del desarrollo y comprueba el
 * recorrido real en un navegador: pagina de estado, login, biblioteca con
 * filtros y comparador. No necesita datos especiales: usa el seed.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm -C ../.. dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
