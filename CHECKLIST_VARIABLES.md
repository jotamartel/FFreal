# ✅ Checklist de Variables de Entorno

## Variables de Supabase (Integración Vercel) ✅

Estas variables ya están configuradas automáticamente:

- [x] `NEXT_PUBLIC_SUPABASE_URL` - URL pública del proyecto
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave pública/anónima
- [x] `INTERNAL_API_KEY` - Clave interna de API

**✅ Estado**: Correcto

---

## ❌ Variable Faltante: DATABASE_URL

**Problema**: El código actual usa `DATABASE_URL` o `POSTGRES_URL` para conectarse directamente a PostgreSQL.

**Solución**: Necesitas agregar la connection string de PostgreSQL de Supabase.

### Cómo Obtener DATABASE_URL:

1. **Ve a Supabase Dashboard**:
   - https://app.supabase.com
   - Selecciona tu proyecto

2. **Settings → Database**:
   - Scroll hasta **Connection string**
   - Tab **URI**

3. **Copia la connection string**:
   - Formato: `postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres`
   - **Reemplaza `[YOUR-PASSWORD]`** con la contraseña que configuraste al crear el proyecto
   - **Agrega `?sslmode=require`** al final

4. **Agregar en Vercel**:
   - Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables
   - **Add New**
   - **Key**: `DATABASE_URL`
   - **Value**: Tu connection string completa
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - **Save**

---

## Variables Requeridas para el Proyecto

### ✅ Base de Datos (Supabase)
- [x] `NEXT_PUBLIC_SUPABASE_URL` ✅ (ya la tienes)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (ya la tienes)
- [x] `DATABASE_URL` ✅ **AGREGADA**

### ❌ Shopify (Faltan todas)
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`
- [ ] `SHOPIFY_SCOPES`
- [ ] `SHOPIFY_APP_URL`
- [ ] `SHOPIFY_API_VERSION`
- [ ] `NEXT_PUBLIC_SHOPIFY_API_KEY`

### ❌ Application (Faltan)
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `SESSION_SECRET`

### ❌ Email/Resend (Faltan)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`

---

## 🎯 Prioridad de Configuración

### 🔴 ALTA PRIORIDAD (Para que funcione el deploy)
1. `DATABASE_URL` - Necesaria para la conexión a la base de datos
2. `NEXT_PUBLIC_APP_URL` - URL de la aplicación
3. `SESSION_SECRET` - Para sesiones seguras

### 🟡 MEDIA PRIORIDAD (Para funcionalidad completa)
4. Variables de Shopify - Para integración con Shopify
5. Variables de Resend - Para envío de emails

---

## 📝 Próximos Pasos

### ✅ Paso 1: Agregar DATABASE_URL - COMPLETADO
- [x] DATABASE_URL agregada en Vercel

### Paso 2: Ejecutar Schema en Supabase ⭐ **SIGUIENTE**
1. Ve a Supabase → SQL Editor
2. Abre `lib/database/schema.sql`
3. Copia y ejecuta el contenido

### Paso 3: Agregar Variables Básicas
- `NEXT_PUBLIC_APP_URL=https://shopify-friends-family-evnenjcg4.vercel.app`
- `SESSION_SECRET` (generar con el comando abajo)

### Paso 4: Redeploy
- Después de agregar `DATABASE_URL`, haz redeploy

---

## 🔧 Comandos Útiles

### Generar SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Verificar variables locales:
```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel env ls
```

---

## ✅ Estado Actual

**Variables configuradas**: 4/13
- ✅ NEXT_PUBLIC_SUPABASE_URL
- ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- ✅ INTERNAL_API_KEY
- ✅ DATABASE_URL ✅ **RECIÉN AGREGADA**

**Variables faltantes**: 9/13
- ❌ Todas las de Shopify (6 variables)
- ❌ NEXT_PUBLIC_APP_URL
- ❌ SESSION_SECRET
- ❌ RESEND_API_KEY
- ❌ RESEND_FROM_EMAIL

---

## 🚀 Después de Agregar DATABASE_URL

1. ✅ Ejecutar schema en Supabase SQL Editor
2. ✅ Agregar variables básicas (APP_URL, SESSION_SECRET)
3. ✅ Redeploy
4. ⏭️ Configurar Shopify
5. ⏭️ Configurar Resend

