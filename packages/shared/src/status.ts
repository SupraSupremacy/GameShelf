export const GAME_STATUSES = ['backlog', 'playing', 'finished', 'abandoned'] as const

export type GameStatus = (typeof GAME_STATUSES)[number]

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  backlog: 'Pendiente',
  playing: 'Jugando',
  finished: 'Terminado',
  abandoned: 'Abandonado',
}

export function isGameStatus(value: string): value is GameStatus {
  return (GAME_STATUSES as readonly string[]).includes(value)
}