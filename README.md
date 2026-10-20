# Game Shelf

Prototipo educativo de una **biblioteca personal de juegos** con comparador de
precios entre Steam, Epic Games Store y GOG.

> **Estado: Fases 0-2 completas, más sesión real y pulido de UI.** Monorepo,
> base de datos migrada y sembrada, contratos compartidos, API funcionando,
> sesión con cookie httpOnly, biblioteca con CRUD, grilla, filtros y
> paginación, alta manual desde Buscar y comparador de precios funcional
> (tabla + resumen). Páginas: estado, Login, Biblioteca, Buscar y Comparar.

## Requisitos

| Herramienta | Version verificada |
| ----------- | ------------------ |
| Node.js     | 24.19.0            |
| pnpm        | 12.9.1             |
| TypeScript  | 5.7+               |

La base de datos es **PostgreSQL**, alojada en **Supabase**. La API se conecta
con el connection string de `DATABASE_URL`; no hay archivo local.

## Puesta en marcha

1. En Supabase → **SQL Editor**, corre [`supabase-00-rename-flat.sql`](supabase-00-rename-flat.sql)
   una vez (libera el nombre `games` de la tabla plana importada antes).
2. Copia `apps/api/.env.example` a `apps/api/.env` y pega tu **connection string**
   de Supabase (Project Settings → Database → Session Pooler).
3. Instala, migra y siembra:

```bash
pnpm install
pnpm setup     # aplica migraciones y siembra el catalogo en Supabase
pnpm dev       # api en :3000 y web en :5173
```

Abrir <http://localhost:5173>.

La migracion ya viene versionada en el repositorio, asi que `setup` no
necesita `db:generate`. Ese comando solo hace falta tras cambiar el esquema.

### Comandos utiles

| Comando             | Que hace                                          |
| ------------------- | ------------------------------------------------- |
| `pnpm dev`          | Levanta API y web a la vez                        |
| `pnpm start`        | Levanta solo la API con `tsx`                     |
| `pnpm setup`        | Crea la base y la siembra                         |
| `pnpm build`        | Compila los tres paquetes                         |
| `pnpm typecheck`    | `tsc --noEmit` en shared, api y web               |
| `pnpm lint`         | ESLint sobre api y web                            |
| `pnpm test`         | Tests unitarios (Vitest, en la api)               |
| `pnpm test:e2e`     | Prueba de humo de navegador (Playwright)          |
| `pnpm format`       | Prettier sobre todo el codigo                     |
| `pnpm db:generate`  | Regenera la migracion desde el esquema            |
| `pnpm db:migrate`   | Aplica migraciones pendientes                     |
| `pnpm db:seed`      | Siembra catalogo y cuentas demo                   |
| `pnpm db:reset`     | Borra las tablas de la app en Postgres            |

## Estructura

```
Game Shelf/
├─ apps/
│  ├─ api/                 Fastify + Drizzle + PostgreSQL (Supabase)
│  │  └─ src/
│  │     ├─ config/        Lectura y validacion de variables de entorno
│  │     ├─ db/            Esquema, migraciones, cliente y seed
│  │     ├─ prices/        PriceSource, ITAD, mock, comparador
│  │     ├─ providers/     Interfaz LibraryProvider + mocks + catalogo
│  │     └─ routes/        Rutas HTTP
│  └─ web/                 React + Vite + Tailwind v4
│     └─ src/
│        ├─ components/    Piezas reutilizables
│        ├─ lib/           Cliente HTTP
│        └─ pages/         Paginas
├─ packages/shared/        Contratos y tipos compartidos por api y web
├─ Documentación.txt       Bitacora por fase
├─ Pruebas.txt             Problemas, causas y soluciones
├─ Pendientes opcionales.txt
└─ ANALISIS-APIs.md        Viabilidad de cada fuente de datos
```

`packages/shared` existe para que api y web compartan exactamente los mismos
tipos. Un cambio en un DTO rompe el typecheck de ambos lados a la vez, en vez
de fallar en silencio en el navegador.

## Modo demo

El prototipo **no pide credenciales de ninguna tienda**. El login es simulado
(se elige una cuenta demo, sin contraseña) y los juegos se dan de alta a mano.
La semilla trae **120 juegos** (catálogo propio + mezcla de títulos conocidos,
indies y un grupo de nicho) y 2 cuentas. La sesión se guarda en una cookie
`httpOnly` firmada; las rutas de biblioteca responden `401` si no hay sesión.

Los precios vienen de IsThereAnyDeal cuando existe `ITAD_API_KEY`, y si no, de
un simulador determinista. Con clave real, la busqueda de Buscar tambien
consulta ITAD y permite añadir títulos que no estan en el catalogo semilla (se
crean en la base la primera vez). El estado se muestra siempre en un distintivo
visible en la cabecera.

Configuracion en `apps/api/.env` (copiar de `.env.example`):

| Variable         | Por defecto | Para que sirve                        |
| ---------------- | ----------- | ------------------------------------- |
| `DATABASE_URL`   | *(obligatorio)* | Connection string de Postgres/Supabase (Session Pooler) |
| `DEMO_MODE`      | `true`      | Muestra el distintivo de demo          |
| `SESSION_SECRET` | *(vacio)*   | Firma la cookie de sesion (hay default de desarrollo) |
| `PRICES_SOURCE`  | `auto`      | `auto`, `itad` o `mock`               |
| `DEFAULT_COUNTRY`| `CL`        | Region para ITAD                      |
| `DEFAULT_CURRENCY`| `CLP`      | Moneda de presentacion                 |
| `ITAD_API_KEY`   | *(vacio)*   | Sin esta clave se usan precios mock   |

## Cuentas demo

| Usuario           | Contrasena | Contenido                        |
| ----------------- | ---------- | -------------------------------- |
| `casual`          | `demo`     | Biblioteca corta                 |
| `coleccionista`   | `demo`     | Biblioteca amplia, con precios   |

## Rutas disponibles en la API

| Metodo | Ruta                          | Que hace                          |
| ------ | ----------------------------- | --------------------------------- |
| GET    | `/api/health`                 | Sonda de vida                     |
| GET    | `/api/info`                   | Configuracion efectiva            |
| GET    | `/api/games/search?q=`        | Busca en el catalogo (sin `q` lista todo; con `ITAD_API_KEY` tambien en ITAD) |
| GET    | `/api/games/genres`           | Generos disponibles               |
| GET    | `/api/providers/:id/preview`  | Cuantos juegos ve cada proveedor  |
| POST   | `/api/auth/login` `/demo`     | Inicia sesion (emite cookie)      |
| POST   | `/api/auth/logout`            | Cierra sesion                     |
| GET    | `/api/auth/me`                | Usuario actual (o `null`)         |
| GET    | `/api/library?status=&provider=&genre=` | Biblioteca paginada y filtrable |
| GET    | `/api/library/stats`          | Estadisticas                      |
| POST   | `/api/games`                  | Alta manual en biblioteca (con id de ITAD, crea el catalogo) |
| PATCH  | `/api/library/:gameId`        | Actualiza estado/notas/precio     |
| DELETE | `/api/library/:gameId`        | Quita de la biblioteca            |
| GET    | `/api/prices/compare/:gameId` | Comparacion de precios entre tiendas |

Sesion con cookie: `/api/auth/login` y `/api/auth/demo` dejan una cookie
`httpOnly` firmada (`gs_session`). Las rutas de biblioteca resuelven el usuario
desde esa cookie y responden `401` si no hay sesion. Ya no se pasa `userId` por
query.

`GET /api/library` filtra por `status`, `provider` y `genre` (los tres se pueden
combinar; `genre` coincide con el nombre del género en la base). LibraryStats
suma `byGenre`, y la página Biblioteca muestra los chips con contador. Cada
tarjeta de la biblioteca tiene un desplegable con el estado (Pendiente, Jugando,
Terminado, Abandonado) que persiste vía `PATCH /api/library/:gameId` y refresca
en silencio listado y stats; cambiar un juego que está filtrado lo saca de esa
vista. En
Buscar el filtro de genero es en cliente, calculado sobre los resultados de la
busqueda actual (un resultado de ITAD no trae generos y solo aparece bajo
"Todos"); la busqueda arranca con una letra y, sin texto, `GET
/api/games/search` lista el catalogo completo para poder filtrar por genero
antes de escribir.

## Pruebas

`pnpm test` corre 55 tests unitarios y de rutas de la api. El foco es el
simulador de precios, que al ser determinista se puede comprobar de forma
exacta, la sesion + el CRUD de biblioteca, que se prueban sobre **PGlite**
(Postgres en proceso, en memoria) con cookie real, y la integridad del catalogo semilla (que no se
dupliquen slugs/titulos y que el seed de 120 juegos sea idempotente):

| Que se comprueba                                  | Por que importa                          |
| ------------------------------------------------ | ---------------------------------------- |
| Misma entrada, misma salida                      | La demo y las capturas son reproducibles |
| Respeta la moneda que se pide                    | Pedir EUR no puede devolver montos de CLP |
| No deja centavos sueltos en pesos                | Un precio de 44.452,50 pesos no existe  |
| El minimo historico nunca supera el precio actual | Si no, la tabla comparativa se contradice |
| Distingue una tienda de otra                     | Sin esto no hay nada que comparar         |
| Un id fuera del catalogo no rompe                | Un dato de mas no puede tumbar la pagina |

`pnpm test:e2e` levanta API y web y corre 3 pruebas de humo con Playwright
(pagina de estado, login -> biblioteca con grilla y filtro, comparador con
tabla).

## Documentacion relacionada

- [`ANALISIS-APIs.md`](ANALISIS-APIs.md) — que se puede obtener de cada
  tienda y que no.
- [`Documentación.txt`](Documentación.txt) — que se hizo en cada fase.
- [`Pruebas.txt`](Pruebas.txt) — problemas encontrados y como se resolvieron.
- [`Pendientes opcionales.txt`](Pendientes%20opcionales.txt) — mejoras
  tecnicas del demo, con prioridad.
