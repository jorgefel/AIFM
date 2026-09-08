---
tags: [backend, cache, worker, cloudflare, edge]
---
# Edge Cache Worker (@aifm/worker)

**Qué hace:** 
Actúa como una capa intermedia (middleware en el Edge) para interceptar solicitudes de lectura frecuentes (`GET /api/v1/users/me` y `GET /api/v1/properties/`) y cachearlas, reduciendo la carga y latencia hacia el backend principal.

**Cómo lo hace:** 
Desplegado como un **Cloudflare Worker**, intercepta las peticiones y verifica la validez del token de sesión (JWT almacenado en cookies). Si el token es válido, genera una llave de caché ligada al usuario y sirve la respuesta almacenada o, en caso de *cache miss*, reenvía la petición al servidor (FastAPI), cacheando la respuesta exitosa (por 2 minutos).

**Estado:** 
Implementado y funcional.

## Detalles Técnicos
- **Archivos Clave:** 
  - `apps/worker/src/index.ts`
  - `apps/worker/wrangler.toml`
- **Dependencias Principales:** `jose` (para la validación estricta y rápida de JWTs usando el algoritmo HS256 directamente en V8 isolates).
- **Seguridad:** 
  - Para prevenir *Cache Poisoning*, el Worker requiere validar la firma criptográfica del JWT (`JWT_SECRET`) antes de siquiera consultar el caché. Esto garantiza que un atacante no pueda enviar un payload falsificado para acceder al caché de otro usuario.

## Enlaces
- Relacionado con: [[01-Modulos/Auth-Users|Auth & Users]], [[04-Seguridad|Seguridad]]
- Volver a [[00-Overview|Overview]]
