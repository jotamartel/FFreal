# 🗄️ Configuración de Supabase para Friends & Family App

Esta guía te ayudará a configurar Supabase como base de datos PostgreSQL para tu aplicación.

---

## Paso 1: Crear Proyecto en Supabase

### 1.1 Crear Cuenta

1. Ve a: https://supabase.com
2. Click **Sign Up** (gratis)
3. Autentica con GitHub, Google, o email

### 1.2 Crear Nuevo Proyecto

1. Click **New Project**
2. Completa la información:
   - **Name**: `friends-family-app` (o el nombre que prefieras)
   - **Database Password**: ⚠️ **GUARDA ESTA CONTRASEÑA** - la necesitarás después
   - **Region**: Selecciona la región más cercana a tus usuarios
   - **Pricing Plan**: Free (suficiente para empezar)
3. Click **Create new project**

⏱️ **Espera 2-3 minutos** mientras se crea el proyecto.

---

## Paso 2: Obtener Connection String

### 2.1 Acceder a Settings

1. En tu proyecto, ve a **Settings** (ícono de engranaje en la barra lateral)
2. Click **Database**

### 2.2 Copiar Connection String

1. Scroll hasta **Connection string**
2. Selecciona la tab **URI**
3. Copia la connection string (formato: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)

⚠️ **IMPORTANTE**: Reemplaza `[YOUR-PASSWORD]` con la contraseña que configuraste al crear el proyecto.

**Ejemplo completo:**
```
postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2.3 Versión con SSL (Recomendada)

Para producción, usa esta versión con SSL:
```
postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

---

## Paso 3: Ejecutar Schema de Base de Datos

### 3.1 Abrir SQL Editor

1. En tu proyecto de Supabase, ve a **SQL Editor** (ícono de SQL en la barra lateral)
2. Click **New query**

### 3.2 Copiar y Ejecutar Schema

1. Abre el archivo: `lib/database/schema.sql` en tu proyecto local
2. **Copia TODO el contenido** del archivo
3. Pega en el editor de Supabase
4. Click **Run** (o presiona `Cmd+Enter` / `Ctrl+Enter`)

### 3.3 Verificar que se Crearon las Tablas

Deberías ver mensajes de éxito como:
```
✅ CREATE TABLE groups
✅ CREATE TABLE group_members
✅ CREATE TABLE invitations
✅ CREATE TABLE discount_configs
✅ CREATE TABLE appointments
✅ CREATE TABLE branches
✅ CREATE TABLE availability_slots
```

### 3.4 Verificar Tablas Creadas

1. Ve a **Table Editor** (ícono de tabla en la barra lateral)
2. Deberías ver todas las tablas listadas:
   - `groups`
   - `group_members`
   - `invitations`
   - `discount_configs`
   - `appointments`
   - `branches`
   - `availability_slots`

---

## Paso 4: Configurar Variable de Entorno en Vercel

### 4.1 Agregar DATABASE_URL

1. Ve a tu proyecto en Vercel: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables
2. Click **Add New**
3. **Key**: `DATABASE_URL`
4. **Value**: Pega tu connection string de Supabase (con SSL):
   ```
   postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```
5. Selecciona los ambientes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Click **Save**

### 4.2 (Opcional) Variables Individuales

Si prefieres usar variables individuales (como en Vercel Postgres), puedes usar:

```env
POSTGRES_URL=postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
POSTGRES_PRISMA_URL=postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
POSTGRES_URL_NON_POOLING=postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Nota**: El código actual usa `POSTGRES_URL` o `DATABASE_URL`, así que con `DATABASE_URL` es suficiente.

---

## Paso 5: Verificar Conexión

### 5.1 Probar Localmente (Opcional)

Crea un archivo `.env.local` en tu proyecto:

```env
DATABASE_URL=postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

Luego prueba la conexión:

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
npm run dev
```

### 5.2 Verificar en Vercel

1. Después de configurar `DATABASE_URL` en Vercel
2. Haz un redeploy: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/deployments
3. Click en el último deployment → **Redeploy**

---

## Paso 6: Configurar Pooling (Opcional pero Recomendado)

Supabase ofrece diferentes tipos de conexión:

### Transaction Pooler (Recomendado para Vercel)

Usa el **pooler** en el puerto **6543**:
```
postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require
```

### Direct Connection

Para conexiones directas (útil para migrations), usa el puerto **5432**:
```
postgresql://postgres.mi_proyecto:TuPassword123@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Recomendación**: Usa el pooler (puerto 6543) para producción, ya que maneja mejor las conexiones concurrentes.

---

## Paso 7: Seguridad y Configuración Adicional

### 7.1 Row Level Security (RLS)

Por defecto, Supabase habilita Row Level Security. Para esta app, puedes deshabilitarlo o configurarlo según tus necesidades:

1. Ve a **Authentication** → **Policies**
2. Configura las políticas según tus necesidades

### 7.2 API Keys (Opcional)

Si en el futuro quieres usar las APIs de Supabase directamente:

1. Ve a **Settings** → **API**
2. Copia:
   - **Project URL**
   - **anon public** key
   - **service_role** key (⚠️ **NUNCA** la expongas en el frontend)

---

## ✅ Checklist

- [ ] Proyecto creado en Supabase
- [ ] Connection string obtenido
- [ ] Schema ejecutado en SQL Editor
- [ ] Tablas verificadas en Table Editor
- [ ] `DATABASE_URL` configurado en Vercel
- [ ] Variable marcada para Production, Preview y Development
- [ ] Redeploy realizado en Vercel
- [ ] Conexión verificada

---

## 🐛 Troubleshooting

### Error: "Connection refused"

**Solución**: Verifica que:
1. La connection string esté correcta
2. El password esté correcto
3. Usas `?sslmode=require` al final

### Error: "Too many connections"

**Solución**: Usa el pooler (puerto 6543) en lugar de conexión directa (5432)

### Error: "SSL required"

**Solución**: Agrega `?sslmode=require` al final de tu connection string

### Error al ejecutar schema

**Solución**: 
1. Verifica que no haya errores de sintaxis en el SQL
2. Ejecuta el schema por partes si es muy grande
3. Verifica que no existan tablas con el mismo nombre

---

## 📚 Recursos

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Supabase Dashboard](https://app.supabase.com)

---

## 🎉 ¡Listo!

Tu base de datos Supabase está configurada y lista para usar. El código de la app ya está preparado para trabajar con Supabase usando el connection string estándar de PostgreSQL.

