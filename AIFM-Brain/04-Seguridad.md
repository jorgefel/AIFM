---
tags: [backend, seguridad, auth, redis]
---
# Seguridad

## Autenticación
Manejado vía JWT (`access_token` y `refresh_token`) guardados en cookies `HttpOnly`, `secure` (en producción), y `samesite='none'`. Contraseñas cacheadas con `bcrypt` (10 rounds).

## Multi-Tenancy
Cada tabla de entidad de negocio (`Property`, `Reservation`, `Expense`) guarda una relación hacia el `owner_id` (o `property_id` que depende del owner). Los endpoints REST incluyen `where(owner_id == current_user.id)` garantizando el aislamiento de datos.

## Rate Limiting
Implementado con Redis y `fastapi-limiter` (Ej. la ruta `/auth/login` restringe a 5 intentos por minuto para mitigar fuerza bruta).

## Edge Cache Security (Cloudflare Worker)
El Cloudflare Worker intercepta peticiones GET sensibles (ej. `/api/v1/users/me`) y sirve respuestas cacheadas. Para prevenir **Cache Poisoning** (donde un atacante podría intentar obtener caché de otro usuario o inyectar un payload malicioso enviando un JWT alterado), el Worker usa la librería `jose` para validar criptográficamente la firma del JWT (con HS256) directamente en el edge. Si el JWT es inválido, carece de firma, o fue alterado, se ignora el caché y la petición se reenvía al backend para rechazarla adecuadamente (401).

## Vulnerabilidades Conocidas
No se encontraron carpetas `/security` ni reportes explícitos de vulnerabilidades en el código fuente. Se asume que no hay vulnerabilidades reportadas, mitigándose las comunes con bcrypt y fastapilimiter.

## Pruebas Pendientes
No se encontraron pruebas explícitamente marcadas como pendientes (ej. `@pytest.mark.skip` o TODOs) en la carpeta `apps/server/tests`. Faltan tests de integración y e2e para los endpoints REST de las rutas (actualmente solo existen tests unitarios para el motor financiero y precisión decimal).

## Enlaces
- Módulo: [[01-Modulos/Auth-Users|Auth & Users]]
- Volver a [[00-Overview|Overview]]
