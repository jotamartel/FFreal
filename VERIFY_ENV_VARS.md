# ✅ Verificación de Variables de Entorno

## Variables de Supabase (Integración Vercel)

Cuando conectas Supabase a través de Vercel, se crean automáticamente estas variables:

### ✅ Variables que ya tienes:
- `NEXT_PUBLIC_SUPABASE_URL` - URL pública de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave pública/anónima de Supabase
- `INTERNAL_API_KEY` - Clave interna de API

### ❌ Variable que FALTA:
- `DATABASE_URL` o `POSTGRES_URL` - Connection string de PostgreSQL

---

## 🔍 Cómo Obtener DATABASE_URL desde Supabase

### Opción 1: Desde Supabase Dashboard (Recomendado)

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. **Settings** (⚙️) → **Database**
4. Scroll hasta **Connection string**
5. Selecciona la tab **URI**
6. Copia la connection string
7. **Reemplaza `[YOUR-PASSWORD]`** con la contraseña de tu base de datos
8. **Agrega `?sslmode=require`** al final si no lo tiene

Formato:
```
postgresql://postgres.xxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Opción 2: Construir desde NEXT_PUBLIC_SUPABASE_URL

Si tienes `NEXT_PUBLIC_SUPABASE_URL`, puedes construir la connection string:

1. La URL de Supabase tiene formato: `https://xxxxx.supabase.co`
2. El host de la DB es: `db.xxxxx.supabase.co` o `aws-0-us-east-1.pooler.supabase.com`
3. Necesitas la contraseña que configuraste al crear el proyecto

---

## 📝 Agregar DATABASE_URL en Vercel

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables

2. Click **Add New**

3. Configura:
   - **Key**: `DATABASE_URL`
   - **Value**: Tu connection string de Supabase (con password y sslmode=require)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

4. Click **Save**

---

## ✅ Variables Requeridas para el Proyecto

### Base de Datos (Supabase)
- [x] `NEXT_PUBLIC_SUPABASE_URL` (ya la tienes)
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ya la tienes)
- [ ] `DATABASE_URL` (necesitas agregarla)

### Shopify (Faltan)
- [ ] `SHOPIFY_API_KEY`
- [ ] `SHOPIFY_API_SECRET`
- [ ] `SHOPIFY_SCOPES`
- [ ] `SHOPIFY_APP_URL`
- [ ] `SHOPIFY_API_VERSION`
- [ ] `NEXT_PUBLIC_SHOPIFY_API_KEY`

### Application
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `SESSION_SECRET`

### Email (Resend)
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`

---

## 🔄 Actualizar Código (Si es necesario)

Si prefieres usar las variables de Supabase directamente, podemos actualizar el código para usar `NEXT_PUBLIC_SUPABASE_URL` y construir la connection string, pero es más complejo. 

**Recomendación**: Usa `DATABASE_URL` con la connection string completa de PostgreSQL (más simple y directo).

---

## 🚀 Próximos Pasos

1. ✅ Verificar que tienes `DATABASE_URL` configurada
2. ✅ Ejecutar schema en Supabase SQL Editor
3. ⏭️ Configurar variables de Shopify
4. ⏭️ Configurar variables de Resend
5. ⏭️ Redeploy

