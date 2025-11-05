# 🗄️ Ejecutar Schema en Supabase

## ✅ Paso Completado
- [x] DATABASE_URL agregada en Vercel

## 🎯 Siguiente Paso: Ejecutar Schema

### Paso 1: Abrir SQL Editor en Supabase

1. Ve a: https://app.supabase.com
2. Selecciona tu proyecto
3. En la barra lateral izquierda, click en **SQL Editor** (ícono de SQL)
4. Click en **New query**

### Paso 2: Copiar el Schema

1. Abre el archivo en tu proyecto local:
   ```
   /Users/julianmartel/appointment/shopify-friends-family-app/lib/database/schema.sql
   ```

2. **Copia TODO el contenido** del archivo (Cmd+A, Cmd+C)

### Paso 3: Pegar y Ejecutar en Supabase

1. En Supabase SQL Editor, **pega** el contenido (Cmd+V)
2. Verifica que el query esté completo
3. Click en **Run** (botón en la esquina superior derecha)
   - O presiona: `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux)

### Paso 4: Verificar que se Crearon las Tablas

Deberías ver mensajes de éxito como:
```
✅ Success. No rows returned
```

O si hay output:
```
✅ CREATE TABLE groups
✅ CREATE TABLE group_members
✅ CREATE TABLE invitations
✅ CREATE TABLE discount_configs
✅ CREATE TABLE appointments
✅ CREATE TABLE branches
✅ CREATE TABLE availability_slots
```

### Paso 5: Verificar en Table Editor

1. En Supabase, ve a **Table Editor** (ícono de tabla en la barra lateral)
2. Deberías ver todas estas tablas:
   - ✅ `groups`
   - ✅ `group_members`
   - ✅ `invitations`
   - ✅ `discount_configs`
   - ✅ `appointments`
   - ✅ `branches`
   - ✅ `availability_slots`

---

## 🐛 Si hay Errores

### Error: "relation already exists"
**Solución**: Las tablas ya existen. Puedes:
- Ignorar el error (está bien)
- O eliminar las tablas y ejecutar de nuevo

### Error: "syntax error"
**Solución**: 
- Verifica que copiaste TODO el contenido
- Verifica que no haya caracteres raros
- Intenta ejecutar por partes

### Error: "permission denied"
**Solución**: 
- Asegúrate de estar en el proyecto correcto
- Verifica que tengas permisos de administrador

---

## ✅ Después de Ejecutar el Schema

Una vez que las tablas estén creadas:

1. ✅ Schema ejecutado
2. ⏭️ Agregar variables básicas (APP_URL, SESSION_SECRET)
3. ⏭️ Configurar variables de Shopify
4. ⏭️ Configurar variables de Resend
5. ⏭️ Redeploy

---

## 📋 Checklist

- [x] DATABASE_URL configurada en Vercel
- [ ] Schema ejecutado en Supabase SQL Editor
- [ ] Tablas verificadas en Table Editor
- [ ] Variables básicas agregadas
- [ ] Variables de Shopify agregadas
- [ ] Variables de Resend agregadas
- [ ] Redeploy realizado

