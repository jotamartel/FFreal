# 📋 Plan de Acción - Siguientes Pasos

## ✅ Ya Completado

- [x] Proyecto creado en Vercel
- [x] Código actualizado para Supabase
- [x] Documentación creada

---

## 🎯 Orden de Pasos Recomendado

### Paso 1: Configurar Supabase (Base de Datos) ⭐ **EMPEZAR AQUÍ**

**Prioridad: ALTA** - Sin esto, el deploy no funcionará.

1. **Crear proyecto en Supabase**
   - Ve a: https://supabase.com
   - Sign Up / Login
   - New Project → `friends-family-app`
   - Guarda la contraseña de la base de datos ⚠️

2. **Obtener Connection String**
   - Settings → Database → Connection string (URI)
   - Copia la string completa
   - Agrega `?sslmode=require` al final si no lo tiene

3. **Ejecutar Schema**
   - SQL Editor → New query
   - Abre `lib/database/schema.sql` en tu proyecto
   - Copia TODO el contenido
   - Pega y ejecuta en Supabase

4. **Configurar en Vercel**
   - Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables
   - Agrega: `DATABASE_URL` = tu connection string de Supabase

**Tiempo estimado**: 10-15 minutos

**Guía detallada**: Ver `SUPABASE_SETUP.md`

---

### Paso 2: Crear App en Shopify Partners

**Prioridad: ALTA** - Necesitas las credenciales para configurar variables.

1. **Crear App**
   - Ve a: https://partners.shopify.com
   - Apps → Create app
   - Nombre: `Friends & Family Discount`
   - App URL: `https://shopify-friends-family-evnenjcg4.vercel.app` (temporal, luego lo actualizas)

2. **Obtener Credenciales**
   - Configuration → Client credentials
   - Copia: **API Key** (Client ID) y **API Secret Key**

3. **Configurar Scopes**
   - Configuration → Scopes
   - Selecciona:
     - `read_products`
     - `write_products`
     - `read_customers`
     - `write_customers`
     - `read_orders`
     - `write_discounts`

4. **Configurar Redirection URL**
   - Configuration → App setup
   - Allowed redirection URL(s): `https://shopify-friends-family-evnenjcg4.vercel.app/api/auth/callback`

**Tiempo estimado**: 5-10 minutos

---

### Paso 3: Configurar Resend (Email Service)

**Prioridad: MEDIA** - Necesario para enviar invitaciones por email.

1. **Crear Cuenta**
   - Ve a: https://resend.com
   - Sign Up (gratis)

2. **Crear API Key**
   - API Keys → Create API Key
   - Nombre: `Friends & Family App`
   - Copia la API key (empieza con `re_`)

3. **Configurar en Vercel**
   - Ve a variables de entorno en Vercel
   - Agrega: `RESEND_API_KEY` = tu API key
   - Agrega: `RESEND_FROM_EMAIL` = `noreply@yourdomain.com` (o usa el dominio de prueba de Resend)

**Tiempo estimado**: 5 minutos

---

### Paso 4: Configurar TODAS las Variables de Entorno en Vercel

**Prioridad: ALTA** - Sin esto, el app no funcionará.

Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables

Agrega estas variables (una por una):

#### ✅ Database (ya deberías tenerla del Paso 1)
```env
DATABASE_URL=postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?sslmode=require
```

#### ✅ Shopify (del Paso 2)
```env
SHOPIFY_API_KEY=tu_api_key_de_shopify
SHOPIFY_API_SECRET=tu_api_secret_de_shopify
SHOPIFY_SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_discounts
SHOPIFY_APP_URL=https://shopify-friends-family-evnenjcg4.vercel.app
SHOPIFY_API_VERSION=2024-10
NEXT_PUBLIC_SHOPIFY_API_KEY=tu_api_key_de_shopify
```

#### ✅ Application URLs
```env
NEXT_PUBLIC_APP_URL=https://shopify-friends-family-evnenjcg4.vercel.app
```

#### ✅ Email (del Paso 3)
```env
RESEND_API_KEY=re_tu_api_key
RESEND_FROM_EMAIL=noreply@yourdomain.com

```

#### ✅ Session Secret
```env
SESSION_SECRET=genera_un_string_aleatorio
```

Para generar SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**IMPORTANTE**: Marca todas las variables para:
- ✅ Production
- ✅ Preview  
- ✅ Development

**Tiempo estimado**: 10 minutos

---

### Paso 5: Redeploy en Vercel

**Prioridad: ALTA** - Para aplicar todas las variables.

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/deployments
2. Click en el último deployment
3. Click **Redeploy**

O desde terminal:
```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod
```

**Tiempo estimado**: 2-3 minutos (esperar que termine el build)

---

### Paso 6: Verificar que Todo Funcione

**Prioridad: ALTA** - Asegurarte de que todo esté bien.

1. **Verificar Deploy**
   - Ve a la URL: https://shopify-friends-family-evnenjcg4.vercel.app
   - Debería cargar sin errores

2. **Verificar Base de Datos**
   - Ve a Supabase → Table Editor
   - Deberías ver todas las tablas creadas

3. **Verificar Variables**
   - Ve a Vercel → Settings → Environment Variables
   - Verifica que todas estén presentes

4. **Verificar Logs**
   - Ve a Vercel → Deployments → Último deployment → Logs
   - No debería haber errores críticos

**Tiempo estimado**: 5 minutos

---

### Paso 7: Instalar App en Tienda de Prueba

**Prioridad: MEDIA** - Para probar la funcionalidad.

1. Ve a tu app en Shopify Partners
2. **Test on development store**
3. Selecciona una tienda de desarrollo
4. Autoriza los permisos
5. La app debería instalarse

**Tiempo estimado**: 5 minutos

---

## ⏱️ Tiempo Total Estimado

- Paso 1 (Supabase): 15 min
- Paso 2 (Shopify): 10 min
- Paso 3 (Resend): 5 min
- Paso 4 (Variables): 10 min
- Paso 5 (Redeploy): 3 min
- Paso 6 (Verificación): 5 min
- Paso 7 (Instalar): 5 min

**Total: ~50 minutos**

---

## 🚀 Empezar Ahora

**Siguiente paso inmediato**: 

👉 **Paso 1: Configurar Supabase**

1. Ve a: https://supabase.com
2. Crea un nuevo proyecto
3. Sigue la guía en `SUPABASE_SETUP.md`

¿Necesitas ayuda con algún paso específico? Puedo guiarte paso a paso.

---

## 📚 Recursos

- **Supabase Setup**: `SUPABASE_SETUP.md`
- **Deploy Completo**: `VERCEL_DEPLOY.md`
- **Estado Actual**: `DEPLOYMENT_STATUS.md`
- **Variables de Entorno**: `.env.example`

