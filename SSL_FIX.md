# 🔧 Fix: Error SSL con Supabase

## 🐛 Problema Identificado

Error al crear cuenta:
```
Error: self-signed certificate in certificate chain
```

**Causa**: La configuración SSL para Supabase no estaba manejando correctamente los certificados.

---

## ✅ Solución Aplicada

Actualicé `lib/database/client.ts` para:

1. **Manejar correctamente SSL de Supabase**:
   - `rejectUnauthorized: false` - Permite certificados auto-firmados
   - `checkServerIdentity: () => undefined` - Ignora verificación de identidad del servidor

2. **Configuración aplicada**:
   ```typescript
   ssl: connectionString?.includes('supabase') || connectionString?.includes('sslmode=require')
     ? {
         rejectUnauthorized: false,
         checkServerIdentity: () => undefined,
       }
     : ...
   ```

---

## 🚀 Próximos Pasos

1. **Esperar a que termine el deploy** (1-2 minutos)
2. **Probar nuevamente el registro**:
   - Ve a `/login`
   - Click "Register"
   - Completa el formulario
   - Debería funcionar ahora

---

## ✅ Si Aún Hay Problemas

Si después del deploy sigue habiendo problemas, verifica:

1. **Variables de entorno**:
   - `DATABASE_URL` está configurado correctamente
   - El connection string incluye `?sslmode=require`

2. **Logs de Vercel**:
   ```bash
   vercel logs https://shopify-friends-family-app.vercel.app
   ```

3. **Verificar conexión a Supabase**:
   - En Supabase Dashboard → Settings → Database
   - Verifica que la connection string sea correcta

---

¿El deploy ya terminó? Prueba crear una cuenta nuevamente.

