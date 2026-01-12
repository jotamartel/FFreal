# ⚡ Recrear Supabase - Guía Rápida

## 🎯 Pasos Rápidos (5 minutos)

### 1️⃣ Crear Proyecto Nuevo
1. Ve a: **https://supabase.com** → **New Project**
2. Completa:
   - Name: `friends-family-app`
   - Password: ⚠️ **GUARDA ESTA CONTRASEÑA**
   - Region: La más cercana
   - Plan: **Free**
3. Espera 2-3 minutos

### 2️⃣ Obtener Connection String
1. Settings → **Database**
2. Scroll hasta **"Connection Pooling"**
3. Selecciona **"Session mode"**
4. Copia la connection string (puerto **6543**)
5. Agrega `?sslmode=require` al final

**Ejemplo:**
```
postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

### 3️⃣ Ejecutar Schema Completo
1. Ve a **SQL Editor** en Supabase
2. Click **"New query"**
3. Abre el archivo: `scripts/setup-supabase-complete.sql`
4. **Copia TODO** el contenido
5. Pégalo en SQL Editor
6. Click **"Run"** (`Cmd+Enter`)

✅ Deberías ver: `Success. No rows returned`

### 4️⃣ Verificar Tablas
1. Ve a **Table Editor**
2. Deberías ver estas tablas:
   - ✅ `users`
   - ✅ `ff_groups`
   - ✅ `ff_group_members`
   - ✅ `ff_invitations`
   - ✅ `ff_discount_config`
   - ✅ `ff_code_usage`
   - ✅ `terms_acceptance`

### 5️⃣ Configurar en Vercel
1. Ve a Vercel → Tu proyecto → **Settings** → **Environment Variables**
2. Agrega/Actualiza:
   - **Key**: `DATABASE_URL`
   - **Value**: Tu connection string completa
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
3. Click **Save**
4. Ve a **Deployments** → Click en el último → **Redeploy**

### 6️⃣ Configurar Localmente
1. Crea/edita `.env.local` en la raíz:
```env
DATABASE_URL=postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

2. Prueba la conexión:
```bash
node scripts/test-supabase-connection.js
```

Deberías ver: `✅ Conexión exitosa!`

### 7️⃣ Probar
1. Inicia el servidor:
```bash
npm run dev
```

2. Visita: **http://localhost:3000/api/debug/db-test**

Deberías ver un JSON con `basic_connection.success: true`

---

## ✅ Checklist

- [ ] Proyecto creado en Supabase
- [ ] Connection string obtenido (puerto 6543)
- [ ] Schema ejecutado (`setup-supabase-complete.sql`)
- [ ] 7 tablas verificadas en Table Editor
- [ ] `DATABASE_URL` actualizada en Vercel
- [ ] Redeploy realizado en Vercel
- [ ] `.env.local` creado localmente
- [ ] Conexión verificada localmente
- [ ] Endpoint de prueba funciona

---

## 🐛 Problemas Comunes

### "password authentication failed"
- Verifica la contraseña en `DATABASE_URL`
- Obtén nueva connection string desde Supabase

### "Connection refused"
- Usa puerto **6543** (pooler), no 5432
- Verifica IPs permitidas en Supabase → Settings → Database

### "relation does not exist"
- Verifica que ejecutaste `setup-supabase-complete.sql`
- Verifica en Table Editor que las tablas existen

---

## 📚 Guía Completa

Para más detalles, ver: `RECREATE_SUPABASE.md`

---

## 🎉 ¡Listo!

Tu nuevo Supabase está configurado y funcionando.
