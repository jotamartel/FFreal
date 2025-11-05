# 📊 Análisis de Variables Configuradas

## ✅ Variables que Tienes (Supabase)

Tienes configuradas estas variables de Supabase:
- `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `POSTGRES_URL_NON_POOLING`
- `SUPABASE_JWT_SECRET`
- `POSTGRES_USER`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`
- `SUPABASE_SERVICE_ROLE_KEY`
- `POSTGRES_HOST`
- `SUPABASE_ANON_KEY`

**Total: 11 variables de Supabase** ✅

---

## ❌ Variables que FALTAN

### 🔴 CRÍTICAS (Necesarias para que funcione)

#### 1. `DATABASE_URL` o `POSTGRES_URL` ⚠️ **IMPORTANTE**

**Problema**: El código actual busca `DATABASE_URL` o `POSTGRES_URL`, pero tienes `POSTGRES_URL_NON_POOLING`.

**Solución**: Puedes:
- **Opción A**: Agregar `DATABASE_URL` con la misma conexión que `POSTGRES_URL_NON_POOLING`
- **Opción B**: Actualizar el código para usar `POSTGRES_URL_NON_POOLING`

**Recomendación**: Opción A (más simple)

**Valor sugerido**: Usa el mismo valor que `POSTGRES_URL_NON_POOLING`

#### 2. `NEXT_PUBLIC_APP_URL` ⚠️ **IMPORTANTE**

**Para qué**: Generar links de invitación, emails, redirecciones

**Valor sugerido**:
```
https://shopify-friends-family-app.vercel.app
```

#### 3. `SESSION_SECRET` ⚠️ **IMPORTANTE**

**Para qué**: Firmar y verificar sesiones

**Cómo generarlo**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 🟡 IMPORTANTES (Para funcionalidad completa)

#### Shopify (6 variables)
- `SHOPIFY_API_KEY` - API Key de Shopify Partners
- `SHOPIFY_API_SECRET` - API Secret de Shopify Partners
- `SHOPIFY_SCOPES` - Permisos (ej: `read_products,write_products,read_customers,write_customers,read_orders,write_discounts`)
- `SHOPIFY_APP_URL` - URL de la app (ej: `https://shopify-friends-family-app.vercel.app`)
- `SHOPIFY_API_VERSION` - Versión de API (ej: `2024-10`)
- `NEXT_PUBLIC_SHOPIFY_API_KEY` - Mismo valor que `SHOPIFY_API_KEY` (para frontend)

#### Email/Resend (2 variables)
- `RESEND_API_KEY` - API Key de Resend (empieza con `re_`)
- `RESEND_FROM_EMAIL` - Email remitente (ej: `noreply@yourdomain.com`)

---

## 🔧 Solución Rápida

### Paso 1: Agregar DATABASE_URL

1. Ve a Vercel → Environment Variables
2. **Agregar nueva variable**:
   - **Key**: `DATABASE_URL`
   - **Value**: Copia el valor de `POSTGRES_URL_NON_POOLING`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development
   - **Save**

### Paso 2: Agregar Variables Básicas

1. **NEXT_PUBLIC_APP_URL**:
   - Value: `https://shopify-friends-family-app.vercel.app`

2. **SESSION_SECRET**:
   - Genera uno con: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   - O usa este (generado anteriormente): `e2f3e4fccbc54dae52ea4adcce9f6de8aacedc8dde72a33493bbc1cbc4284fa9`

### Paso 3: Variables de Shopify (Opcional por ahora)

Si quieres funcionalidad completa, agrega las 6 variables de Shopify después.

### Paso 4: Variables de Resend (Opcional por ahora)

Si quieres enviar emails, agrega las 2 variables de Resend después.

---

## ✅ Checklist de Variables

### Base de Datos
- [x] Variables de Supabase (11 variables) ✅
- [ ] `DATABASE_URL` ❌ **FALTA - Agregar**

### Application
- [ ] `NEXT_PUBLIC_APP_URL` ❌ **FALTA - Agregar**
- [ ] `SESSION_SECRET` ❌ **FALTA - Agregar**

### Shopify
- [ ] `SHOPIFY_API_KEY` ❌ **FALTA - Opcional por ahora**
- [ ] `SHOPIFY_API_SECRET` ❌ **FALTA - Opcional por ahora**
- [ ] `SHOPIFY_SCOPES` ❌ **FALTA - Opcional por ahora**
- [ ] `SHOPIFY_APP_URL` ❌ **FALTA - Opcional por ahora**
- [ ] `SHOPIFY_API_VERSION` ❌ **FALTA - Opcional por ahora**
- [ ] `NEXT_PUBLIC_SHOPIFY_API_KEY` ❌ **FALTA - Opcional por ahora**

### Email
- [ ] `RESEND_API_KEY` ❌ **FALTA - Opcional por ahora**
- [ ] `RESEND_FROM_EMAIL` ❌ **FALTA - Opcional por ahora**

---

## 🎯 Prioridad

### 🔴 ALTA (Agregar ahora)
1. `DATABASE_URL` - Para que el código funcione
2. `NEXT_PUBLIC_APP_URL` - Para generar links
3. `SESSION_SECRET` - Para sesiones

### 🟡 MEDIA (Agregar después)
4. Variables de Shopify - Para funcionalidad completa
5. Variables de Resend - Para emails

---

## 💡 Recomendación

**Agrega primero estas 3 variables críticas**:
1. `DATABASE_URL` (copiar valor de `POSTGRES_URL_NON_POOLING`)
2. `NEXT_PUBLIC_APP_URL` = `https://shopify-friends-family-app.vercel.app`
3. `SESSION_SECRET` = `e2f3e4fccbc54dae52ea4adcce9f6de8aacedc8dde72a33493bbc1cbc4284fa9`

Luego haz redeploy y prueba que todo funcione.

Después puedes agregar Shopify y Resend cuando estés listo.

