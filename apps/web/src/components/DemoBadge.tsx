import type { AppInfo } from '@gameshelf/shared'

/**
 * Marca visible de modo demo.
 *
 * El objetivo del proyecto es mostrar el prototipo sin credenciales
 * reales, asi que el estado de demo se declara siempre, no solo cuando
 * faltan datos: es una decision de producto, no un error.
 */
export function DemoBadge({ info }: { info?: AppInfo }) {
  const esDemo = info ? info.demoMode : true
  const origen = info?.pricesSource === 'itad' ? 'ITAD' : 'simulados'

  return (
    <span
      className={
        esDemo
          ? 'rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300'
          : 'rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300'
      }
    >
      {esDemo ? 'Modo demo' : 'Datos reales'} · Precios {origen}
    </span>
  )
}