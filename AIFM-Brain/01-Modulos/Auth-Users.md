---
tags: [backend, modulo, auth, seguridad]
---
# Auth & Users (Backend)

**Qué hace:** 
Gestión de sesiones, login, registro, logout y roles de usuarios.

**Cómo lo hace:** 
Utiliza JWT (access_token, refresh_token) almacenados en cookies HttpOnly y encriptación de contraseñas con bcrypt. Implementa Rate Limiting con Redis para endpoints sensibles.

**Estado:** 
Completo

## Detalles Técnicos
- **Archivos Clave:** 
  - `apps/server/app/api/v1/routes/auth.py`
  - `apps/server/app/core/security.py`
  - `apps/server/app/models/user.py`
  - `apps/web/src/hooks/useAutoLogout.ts` (Logout automático en el cliente)
- **Dependencias Principales:** bcrypt, jwt, fastapi_limiter, jose (en el Edge)
- **Endpoints / Funciones:** 
  - POST /auth/register
  - POST /auth/login
  - POST /auth/refresh
  - POST /auth/logout
- **Edge Cache (Cloudflare Worker):** Intercepta peticiones de lectura cacheadas, validando firmas de JWT (`jose` con HS256) directamente en el edge para prevenir envenenamiento de caché.

## Enlaces
- Ver también: [[04-Seguridad|Seguridad]] y [[05-Base-de-Datos|Base de Datos]]
- Volver a [[00-Overview|Overview]]
