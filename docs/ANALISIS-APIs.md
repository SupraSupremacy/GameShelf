# Analisis de APIs de datos

Investiguacion previa a la implementacion: que se puede obtener realmente de
cada tienda, que no, y que implico para el prototipo.

Resumen: **ninguna de las tres tiendas ofrece una API publica de biblioteca.**
Por eso el prototipo no se apoya en ninguna, y el comparador de precios se
resuelve con IsThereAnyDeal.

---

## Steam

### Lo que si funciona

| Endpoint                                        | Uso                                   | Auth |
| ----------------------------------------------- | ------------------------------------- | ---- |
| `store.steampowered.com/api/appdetails?appids=` | Metadatos y precio de la tienda      | No   |
| `steamcommunity.com/openid/login`               | Inicio de sesion OpenID               | No   |
| `api.steampowered.com/ISteamUser/GetOwnedGames` | Biblioteca del usuario                | Si   |

`appdetails` responde `200` y entrega generos, fecha de salida y
`price_overview`. Es la unica de las tres que da metadatos utiles sin
credenciales. El endpoint OpenID responde `302`, que es el comportamiento
correcto del handshake.

### Lo que no

`GetOwnedGames` devuelve `401` sin una API key. La key se obtiene
registrandose en Steamworks, asociada a una cuenta de Steam Partner con saldo y
documentacion de Steam. No es razonable para un prototipo educativo.

Ademas, `appdetails` no esta documentado como API estable: es lo que usa la
propia tienda por debajo. Puede cambiar sin aviso.

### Conclusion

Util para **enriquecer** un catalogo, no para obtener una biblioteca. En este
proyecto queda encapsulado tras la interfaz `LibraryProvider`, con un mock.

---

## GOG

GOG no tiene una API publica oficial de biblioteca. Hay endpoints que usa su
propio sitio web, documentados solo de forma no oficial:

| Endpoint                                          | Uso                        |
| ------------------------------------------------- | -------------------------- |
| `embed.gog.com/account/getFilteredProducts`       | Biblioteca del usuario     |
| `api.gog.com/v2/games/{id}/prices`                | Precios por tienda         |
| OAuth de GOG                                      | Autenticacion de la web    |

El acceso requiere OAuth de aplicacion y las URLs pueden cambiar sin aviso.
La documentacion comun se apoya en bibliotecas de terceros que rastrean
endpoints, lo cual es fragil.

### Conclusion

Descartado como fuente de biblioteca. Los precios de GOG si se pueden
obtener, y de hecho es una de las tiendas que cubre ITAD.

---

## Epic Games Store

**No existe API publica.** Esto se comprobo directamente:

| Intento                                          | Resultado |
| ------------------------------------------------ | --------- |
| `store-site-backend-static.ak.epicgames.com/freeGamesPromotions` | `200`, solo juegos gratis |
| GraphQL en `store.epicgames.com/graphql`         | `404` / `403` |
| Paginas HTML de producto                         | `403`      |

El unico endpoint que responde es el de promociones gratuitas. Sirve para
titulos gratis, no para una biblioteca ni para un catalogo de precios.

### Conclusion

Descartado. La comparacion de precios de Epic llega por ITAD.

---

## IsThereAnyDeal (ITAD)

Es la pieza que resuelve el comparador de precios.

| Endpoint                | Metodo | Uso                          |
| ----------------------- | ------ | ---------------------------- |
| `/games/search/v1`      | GET    | Buscar juegos por titulo     |
| `/games/lookup/v1`      | POST   | Buscar por tienda e id       |
| `/pricing/v1/games`     | POST   | Precios de varias tiendas    |
| `/overview/v1`          | POST   | Resumen y disponibilidad    |

Devuelve el precio **histórico mínimo** ademas del actual, con fecha e
historial, y cubre Steam, GOG y Epic en la misma consulta. Eso permite
mostrar en la tabla cosas que ninguna tienda da por separado.

### Como queda integrado

```
PriceSource (interfaz)
├─ ItadPriceSource   usa ITAD cuando hay ITAD_API_KEY
└─ MockPriceSource   simulador determinista
```

La eleccion depende de `PRICES_SOURCE`:

| Valor     | Comportamiento                                        |
| --------- | ----------------------------------------------------- |
| `auto`    | ITAD si hay clave, si no mock. Es el predeterminado. |
| `itad`    | Solo ITAD. Sin clave, error explícito.                |
| `mock`    | Siempre simulado. Cero llamadas de red.               |

El simulador no usa azar: deriva el precio de un `baseHint` por juego y aplica
un descuento determinista a las tiendas marcadas en `onSale`. La misma consulta
devuelve siempre la misma tabla, lo que hace las capturas del demo
reproducibles.

### Ampliar el catalogo con ITAD

`/games/search/v1` tambien permite encontrar juegos que no estan en la semilla:
`/api/games/search` lo consulta cuando hay `ITAD_API_KEY` y marca esos
resultados con `fromItad`, y `POST /api/games` crea la entrada del catalogo la
primera vez que se da de alta. El titulo queda en `games` con su `itadId` real,
asi el comparador le trae precios de verdad por ITAD. Sin clave no cambia nada:
la busqueda es solo del catalogo local, y un juego traido por ITAD no tendria
precios simulados (el comparador muestra un aviso).

### Advertencias

- ITAD pide credenciales y puede imponer limites de uso.
- Sus terminos restringen usos que compitan con su servicio. Un prototipo
  educativo con atribucion visible es un uso de bajo riesgo, pero conviene
  revisar los terminos vigentes antes de publicar el trabajo.
- La atribucion a ITAD debe ser visible en la interfaz cuando se usen datos
  reales. El distintivo de la cabecera ya distingue el origen.

---

## Decision final

| Necesidad                | Fuente elegida | Motivo                                  |
| ------------------------ | -------------- | --------------------------------------- |
| Biblioteca del usuario   | Alta manual    | Ninguna tienda la ofrece sin credenciales |
| Metadatos del catalogo   | Semilla propia | Control total y demo reproducible       |
| Precios comparados       | ITAD o mock    | ITAD cubre las tres tiendas de una vez  |
| Autenticacion            | Simulada       | Sin pedir cuentas de terceros            |

Esta decision es justamente lo que hace que el demo funcione sin
configuracion: sin clave de ITAD, el sistema completo opera con datos
simulados y queda listo para cambiar a datos reales solo con la variable de
entorno.
