-- Paso 0: liberar el nombre `games`.
-- La tabla "plana" que se importo antes pasa a llamarse `games_flat` para no
-- chocar con el esquema normalizado real de la app (games + genres + ...).
-- Ejecutar una sola vez en Supabase > SQL Editor.

alter table public.games rename to games_flat;
