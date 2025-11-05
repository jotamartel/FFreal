# 🔐 Plan de Autenticación y Tienda Cerrada

## 🎯 Objetivos

1. **Tienda cerrada**: Solo usuarios autenticados pueden acceder
2. **Sistema de usuarios**: Login con email/contraseña
3. **Autogestión**: Usuarios pueden invitar familiares/amigos desde el frontend
4. **Gestión de grupos**: Usuarios pueden crear y gestionar sus propios grupos

---

## 📋 Implementación Necesaria

### 1. Base de Datos - Tabla de Usuarios

Necesitamos agregar una tabla `users` para almacenar credenciales:

```sql
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  shopify_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

### 2. Sistema de Autenticación

**Componentes necesarios**:
- `/app/login/page.tsx` - Página de login
- `/app/api/auth/login/route.ts` - Endpoint de login
- `/app/api/auth/logout/route.ts` - Endpoint de logout
- `/app/api/auth/register/route.ts` - Endpoint de registro (opcional)
- `lib/auth/session.ts` - Manejo de sesiones con JWT
- `lib/auth/password.ts` - Hash de contraseñas con bcrypt
- `middleware.ts` - Proteger rutas

### 3. Protección de Rutas

**Rutas protegidas**:
- `/customer/*` - Requiere autenticación
- `/api/customer/*` - Requiere autenticación
- `/api/groups/*` - Requiere autenticación (excepto algunas)

**Rutas públicas**:
- `/login` - Página de login
- `/api/auth/*` - Endpoints de autenticación
- `/customer/invitations/[token]` - Aceptar invitación (sin login)

### 4. Integración con Grupos

**Actualizar**:
- `group_members` para usar `user_id` en lugar de solo `customer_id`
- Customer portal para obtener `user_id` de la sesión
- APIs para filtrar por `user_id` autenticado

---

## 🔧 Cambios Necesarios

### A. Actualizar Schema

Agregar tabla `users` y actualizar `ff_group_members` para incluir `user_id`.

### B. Crear Sistema de Auth

1. **Login/Logout**:
   - Página de login
   - Endpoints de auth
   - Manejo de sesiones JWT

2. **Middleware**:
   - Proteger rutas
   - Verificar tokens
   - Redirigir a login si no autenticado

3. **Password Hashing**:
   - Usar bcrypt para hashear contraseñas
   - Verificar contraseñas en login

### C. Actualizar Customer Portal

1. **Obtener usuario de sesión**:
   - En lugar de `customerId` mock, obtener de JWT
   - Filtrar grupos por `user_id`

2. **Mantener funcionalidad de invitaciones**:
   - Los usuarios pueden seguir invitando
   - Los invitados pueden aceptar sin login (crear cuenta automáticamente)

---

## 📝 Flujo de Usuario

### Usuario Existente
1. Accede a `/customer` → Redirige a `/login`
2. Ingresa email/contraseña → Login
3. Redirige a `/customer` → Ve sus grupos
4. Puede crear grupos, invitar, gestionar

### Nuevo Usuario (Registro)
1. Accede a `/customer` → Redirige a `/login`
2. Click en "Registrarse" → Formulario de registro
3. Crea cuenta → Login automático
4. Puede crear grupos, invitar, gestionar

### Invitación
1. Usuario A invita a Usuario B por email
2. Usuario B recibe link de invitación
3. Click en link → Puede aceptar sin login
4. Si no tiene cuenta, se crea automáticamente
5. Se une al grupo → Login automático

---

## 🚀 Orden de Implementación

### Fase 1: Base de Datos ✅
- [ ] Agregar tabla `users` al schema
- [ ] Actualizar `ff_group_members` para incluir `user_id`
- [ ] Ejecutar migración en Supabase

### Fase 2: Autenticación 🔄
- [ ] Crear `lib/auth/password.ts` (hash/verify)
- [ ] Crear `lib/auth/session.ts` (JWT)
- [ ] Crear `/app/api/auth/login/route.ts`
- [ ] Crear `/app/api/auth/logout/route.ts`
- [ ] Crear `/app/api/auth/register/route.ts` (opcional)

### Fase 3: UI de Login 🔄
- [ ] Crear `/app/login/page.tsx`
- [ ] Crear `/app/register/page.tsx` (opcional)
- [ ] Actualizar layout para mostrar login si no autenticado

### Fase 4: Middleware 🔄
- [ ] Crear `middleware.ts` para proteger rutas
- [ ] Verificar JWT en rutas protegidas
- [ ] Redirigir a login si no autenticado

### Fase 5: Actualizar Customer Portal 🔄
- [ ] Obtener `user_id` de sesión (no mock)
- [ ] Filtrar grupos por `user_id`
- [ ] Actualizar APIs para usar `user_id`

### Fase 6: Integración con Invitaciones 🔄
- [ ] Permitir aceptar invitación sin login
- [ ] Crear cuenta automáticamente si no existe
- [ ] Login automático después de aceptar

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ JWT con expiración
- ✅ HTTPS obligatorio
- ✅ Validación de inputs
- ✅ Rate limiting en login (opcional)

---

## 📚 Archivos a Crear/Modificar

### Nuevos
- `lib/database/users.ts` - CRUD de usuarios
- `lib/auth/password.ts` - Hash/verify contraseñas
- `lib/auth/session.ts` - Manejo de JWT
- `app/login/page.tsx` - Página de login
- `app/api/auth/login/route.ts` - Login endpoint
- `app/api/auth/logout/route.ts` - Logout endpoint
- `app/api/auth/register/route.ts` - Registro endpoint
- `middleware.ts` - Protección de rutas

### Modificar
- `lib/database/schema.sql` - Agregar tabla users
- `app/customer/page.tsx` - Usar sesión real
- `app/customer/groups/[id]/page.tsx` - Usar sesión real
- `app/api/customer/*` - Verificar autenticación
- `app/api/groups/*` - Verificar autenticación
- `app/api/invitations/[token]/accept/route.ts` - Crear cuenta si no existe

---

## ⏱️ Tiempo Estimado

- **Fase 1**: 10 minutos
- **Fase 2**: 30 minutos
- **Fase 3**: 20 minutos
- **Fase 4**: 20 minutos
- **Fase 5**: 30 minutos
- **Fase 6**: 20 minutos

**Total**: ~2 horas

---

¿Quieres que comience con la implementación? Puedo empezar por la Fase 1 (Base de Datos) y luego seguir con las demás.

