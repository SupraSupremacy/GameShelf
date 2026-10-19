import { expect, test } from '@playwright/test'

test('la pagina de estado confirma que el API responde', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Base del proyecto funcionando' })).toBeVisible()
  await expect(page.getByText('Conectada')).toBeVisible()
})

test('login, biblioteca con grilla y filtro por estado', async ({ page }) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Entrar como casual (demo)' }).click()
  await page.waitForURL('**/biblioteca')

  await expect(page.getByRole('heading', { name: 'Biblioteca' })).toBeVisible()
  const tarjetas = page.locator('article')
  await expect(tarjetas.first()).toBeVisible()
  const total = await tarjetas.count()
  expect(total).toBeGreaterThan(0)

  await page.getByRole('button', { name: /^Jugando/ }).click()
  await expect(page.locator('article').first()).toBeVisible()
  const filtradas = await page.locator('article').count()
  expect(filtradas).toBeLessThanOrEqual(total)
})

test('el comparador muestra la tabla de las tres tiendas', async ({ page }) => {
  await page.goto('/comparar?gameId=1')
  await expect(page.getByRole('heading', { name: 'Comparar precios' })).toBeVisible()
  const filas = page.locator('table tbody tr')
  await expect(filas.first()).toBeVisible()
  expect(await filas.count()).toBeGreaterThan(0)
})
