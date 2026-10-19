import type {
  AppInfo,
  GameDetail,
  LibraryEntry,
  LibraryStats,
  Paginated,
  SearchResult,
  SessionUser,
} from '@gameshelf/shared'

/**
 * Cliente HTTP del API.
 *
 * Todas las rutas son relativas: Vite hace proxy de /api al backend en
 * desarrollo, y en produccion lo mismo sirve el frontend y el API.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

/**
 * Fallo de transporte: `fetch` rechazo (sin red, DNS, timeout, CORS...).
 * A diferencia de un 4xx, no es culpa de los datos enviados, asi que tiene
 * sentido ofrecer "Reintentar".
 */
export class NetworkError extends Error {
  constructor(message = 'No se pudo conectar con el servidor') {
    super(message)
    this.name = 'NetworkError'
  }
}

/**
 * true si vale la pena reintentar la operacion: fallo de red o un error del
 * servidor (5xx). Un error de validacion (4xx) no se reintenta: hay que
 * corregir la peticion.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof ApiError) return error.status >= 500
  return true
}

export interface LibraryQuery {
  page?: number
  limit?: number
  status?: string
  provider?: string
  genre?: string
}

async function errorMessage(res: Response, path: string): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; message?: string }
    if (body.error) return body.error
    if (body.message) return body.message
  } catch {
    // Respuesta sin JSON: se usa el mensaje generico.
  }
  return `API ${res.status} en ${path}`
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      credentials: 'include',
      headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
      ...init,
    })
  } catch {
    // fetch solo rechaza por problemas de red; los 4xx/5xx llegan como res.
    throw new NetworkError()
  }

  if (!res.ok) {
    throw new ApiError(await errorMessage(res, path), res.status)
  }
  return res.json() as Promise<T>
}

export const api = {
  info: () => request<AppInfo>('/info'),
  health: () => request<{ ok: boolean }>('/health'),

  // Sesion
  me: () => request<{ user: SessionUser | null }>('/auth/me'),
  login: (username: string) =>
    request<{ user: SessionUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
  loginDemo: () =>
    request<{ user: SessionUser }>('/auth/demo', { method: 'POST' }),
  logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),

  // Biblioteca
  library: (query: LibraryQuery = {}) => {
    const q = new URLSearchParams()
    if (query.page) q.set('page', String(query.page))
    if (query.limit) q.set('limit', String(query.limit))
    if (query.status) q.set('status', query.status)
    if (query.provider) q.set('provider', query.provider)
    if (query.genre) q.set('genre', query.genre)
    const s = q.toString()
    return request<Paginated<LibraryEntry>>(`/library${s ? `?${s}` : ''}`)
  },
  libraryStats: () => request<LibraryStats>('/library/stats'),
  addGame: (body: {
    itadId?: string | null
    slug?: string
    title: string
    platform: string
    pricePaid?: number | null
  }) => request<LibraryEntry>('/games', { method: 'POST', body: JSON.stringify(body) }),
  updateGame: (gameId: number, body: Record<string, unknown>) =>
    request<LibraryEntry>(`/library/${gameId}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  removeGame: (gameId: number) =>
    request<{ ok: true }>(`/library/${gameId}`, { method: 'DELETE' }),

  // Catalogo y comparador
  search: (q: string) => request<{ items: SearchResult[] }>(`/games/search?q=${encodeURIComponent(q)}`),
  genres: () => request<{ genres: string[] }>('/games/genres'),
  providerPreview: (provider: string) =>
    request<{ provider: string; count: number }>(`/providers/${provider}/preview`),
  compare: (gameId: number) => request<GameDetail>(`/prices/compare/${gameId}`),
}