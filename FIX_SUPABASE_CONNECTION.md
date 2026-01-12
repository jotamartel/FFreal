# 🔧 Solución Rápida: Base de Datos Supabase No Funciona

## ❌ Problema Detectado

La variable `DATABASE_URL` no está configurada en tu entorno local.

## ✅ Solución Paso a Paso

### Paso 1: Obtener Connection String de Supabase

1. **Ve a Supabase Dashboard**: https://app.supabase.com
2. **Selecciona tu proyecto**
3. **Ve a Settings** → **Database**
4. **Scroll hasta "Connection string"**
5. **Selecciona la tab "URI"**
6. **Copia la connection string** (formato: `postgresql://postgres:[PASSWORD]@...`)

### Paso 2: Usar Connection Pooling (Recomendado)

Para mejor rendimiento y evitar problemas de conexión, usa el **Connection Pooler**:

1. En Supabase Dashboard → Settings → Database
2. Busca **"Connection Pooling"**
3. Selecciona **"Session mode"** o **"Transaction mode"**
4. Copia la connection string del pooler (puerto **6543**)

**Formato esperado:**
```
postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### Paso 3: Crear/Actualizar .env.local

1. **Crea o edita** el archivo `.env.local` en la raíz del proyecto:

```bash
# En la raíz del proyecto
touch .env.local
```

2. **Agrega la variable DATABASE_URL**:

```env
DATABASE_URL=postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

⚠️ **IMPORTANTE**: 
- Reemplaza `xxxxx` con tu proyecto ID
- Reemplaza `TuPassword` con tu contraseña de base de datos
- **NO** incluyas espacios alrededor del `=`
- **NO** uses comillas alrededor del valor

### Paso 4: Verificar Conexión

Ejecuta el script de diagnóstico:

```bash
node scripts/test-supabase-connection.js
```

Deberías ver:
```
✅ Conexión exitosa!
✅ Se encontraron X tablas
✅ Tabla users existe
```

### Paso 5: Si Aún No Funciona

#### Error: "password authentication failed"
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Obtén una nueva connection string desde Supabase Dashboard

#### Error: "Connection refused" o "ETIMEDOUT"
- Verifica que uses el puerto correcto:
  - **6543** para Connection Pooler (recomendado)
  - **5432** para conexión directa
- Verifica que tu IP esté permitida en Supabase:
  - Settings → Database → Connection Pooling → Allowed IPs

#### Error: "SSL required"
- Asegúrate de que la connection string termine con `?sslmode=require`
- El código ya maneja SSL automáticamente, pero el parámetro ayuda

#### Error: "No se encontraron tablas"
- Ejecuta el schema en Supabase SQL Editor:
  1. Ve a Supabase → SQL Editor
  2. Abre `lib/database/schema.sql`
  3. Copia y pega todo el contenido
  4. Ejecuta (Cmd+Enter)

## 🔍 Verificación Rápida

Ejecuta este comando para verificar tu configuración:

```bash
# Verificar que existe .env.local
ls -la .env.local

# Verificar que DATABASE_URL está configurada (sin mostrar el valor completo)
grep -q "DATABASE_URL" .env.local && echo "✅ DATABASE_URL encontrada" || echo "❌ DATABASE_URL no encontrada"
```

## 📝 Ejemplo Completo de .env.local

```env
# Supabase Database
DATABASE_URL=postgresql://postgres.abcdefghijklmnop:TuPassword123@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Otras variables de Supabase (opcionales)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Shopify (si las tienes)
SHOPIFY_API_KEY=...
SHOPIFY_API_SECRET=...
```

## 🚀 Después de Configurar

1. **Reinicia el servidor de desarrollo**:
   ```bash
   # Detén el servidor (Ctrl+C) y vuelve a iniciarlo
   npm run dev
   ```

2. **Prueba la conexión** visitando:
   ```
   http://localhost:3000/api/debug/db-test
   ```

3. **Deberías ver** un JSON con información de la conexión y las tablas.

---

## 💡 Notas Adicionales

- El archivo `.env.local` está en `.gitignore` por seguridad (no se sube a Git)
- Para producción en Vercel, agrega `DATABASE_URL` en Vercel Dashboard → Settings → Environment Variables
- El código detecta automáticamente si es Supabase y configura SSL correctamente
