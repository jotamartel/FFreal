# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar la **Shopify Friends & Family App** en un nuevo proyecto de Vercel.

## 📋 Prerrequisitos

1. ✅ Cuenta de Vercel (gratis): https://vercel.com/signup
2. ✅ Cuenta de Shopify Partners: https://partners.shopify.com
3. ✅ Repositorio Git (GitHub, GitLab, o Bitbucket)

---

## Paso 1: Preparar el Repositorio

### 1.1 Verificar que todo esté commiteado

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
git status
```

Si hay cambios sin commit:
```bash
git add .
git commit -m "Ready for Vercel deployment"
```

### 1.2 Push al repositorio remoto

```bash
git push origin main
```

---

## Paso 2: Crear Proyecto en Vercel

### 2.1 Importar Proyecto

1. Ve a: https://vercel.com/new
2. **Import Git Repository** → Selecciona tu repositorio
3. **Project Name**: `shopify-friends-family-app` (o el nombre que prefieras)
4. **Framework Preset**: Next.js (debería detectarse automáticamente)
5. **Root Directory**: `./` (dejar por defecto)
6. **Build Command**: `npm run build` (por defecto)
7. **Output Directory**: `.next` (por defecto)
8. **Install Command**: `npm install` (por defecto)

### 2.2 Configurar Variables de Entorno (Temporalmente básicas)

En este paso solo configuraremos las mínimas necesarias para el build. Las demás las agregaremos después.

**NO hagas deploy todavía**, solo configura:
- `NODE_ENV=production`

---

## Paso 3: Configurar Base de Datos

### Opción A: Vercel Postgres (Recomendado) ⭐

1. En el dashboard de Vercel, ve a tu proyecto
2. **Storage** → **Create Database**
3. Selecciona **Postgres**
4. **Database name**: `friends-family-db`
5. **Region**: Selecciona la más cercana (ej: `us-east-1`)
6. Click **Create**
7. **Connect to project** → Selecciona tu proyecto → **Connect**

Vercel automáticamente agregará estas variables:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_HOST`
- `POSTGRES_PASSWORD`
- `POSTGRES_DATABASE`

### Opción B: Supabase

1. Ve a: https://supabase.com
2. **New Project**
3. Configura el proyecto (nombre, región, contraseña)
4. Espera a que se cree (2-3 minutos)
5. **Settings** → **Database** → **Connection string** → **URI**
6. Copia la connection string (formato: `postgresql://postgres:[password]@[host]:5432/postgres`)

---

## Paso 4: Ejecutar Schema de Base de Datos

### Si usas Vercel Postgres:

1. Ve a: **Storage** → Tu base de datos → **Data** → **Query**
2. Abre el archivo: `lib/database/schema.sql`
3. Copia TODO el contenido
4. Pega en el editor de queries
5. Click **Run Query**

Deberías ver:
```
✅ CREATE TABLE groups
✅ CREATE TABLE group_members
✅ CREATE TABLE invitations
✅ CREATE TABLE discount_configs
✅ CREATE TABLE appointments
✅ CREATE TABLE branches
✅ CREATE TABLE availability_slots
```

### Si usas Supabase:

1. Ve a: **SQL Editor** → **New Query**
2. Pega el contenido de `lib/database/schema.sql`
3. Click **Run**

---

## Paso 5: Crear App en Shopify Partners

### 5.1 Crear Nueva App

1. Ve a: https://partners.shopify.com
2. **Apps** → **Create app**
3. **App name**: `Friends & Family Discount`
4. **App URL**: `https://your-app.vercel.app` (lo actualizarás después)
5. **Allowed redirection URL(s)**: 
   ```
   https://your-app.vercel.app/api/auth/callback
   ```
6. Click **Create app**

### 5.2 Configurar API Credentials

1. En tu app, ve a **Configuration** → **Client credentials**
2. Copia:
   - **API Key** (Client ID)
   - **API Secret Key** (Client Secret)

### 5.3 Configurar Scopes

1. Ve a **Configuration** → **Scopes**
2. Selecciona estos scopes:
   ```
   ✅ read_products
   ✅ write_products
   ✅ read_customers
   ✅ write_customers
   ✅ read_orders
   ✅ write_discounts
   ✅ read_price_rules
   ✅ write_price_rules
   ```

---

## Paso 6: Configurar Resend (Email Service)

### 6.1 Crear Cuenta

1. Ve a: https://resend.com
2. **Sign Up** (gratis)
3. Verifica tu email

### 6.2 Crear API Key

1. **API Keys** → **Create API Key**
2. **Name**: `Friends & Family App`
3. **Permission**: Full access
4. Click **Create**
5. **Copia la API key** (empieza con `re_`)

### 6.3 Configurar Dominio (Opcional pero recomendado)

1. **Domains** → **Add Domain**
2. Ingresa tu dominio (ej: `yourdomain.com`)
3. Agrega los registros DNS que te indique
4. Espera verificación (puede tardar hasta 24 horas)

Por ahora puedes usar el dominio de prueba de Resend.

---

## Paso 7: Configurar TODAS las Variables de Entorno en Vercel

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agrega las siguientes variables (una por una):

### Variables Requeridas:

```env
# Shopify
SHOPIFY_API_KEY=tu_api_key_de_shopify
SHOPIFY_API_SECRET=tu_api_secret_de_shopify
SHOPIFY_SCOPES=read_products,write_products,read_customers,write_customers,read_orders,write_discounts
SHOPIFY_APP_URL=https://your-app.vercel.app
SHOPIFY_API_VERSION=2024-10

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SHOPIFY_API_KEY=tu_api_key_de_shopify

# Email (Resend)
RESEND_API_KEY=re_tu_api_key_de_resend
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Session Secret (genera uno aleatorio)
SESSION_SECRET=tu_string_secreto_aleatorio_de_32_caracteres
```

### Generar SESSION_SECRET:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Variables de Base de Datos:

Si usaste **Vercel Postgres**, estas ya están configuradas automáticamente. Si usas **Supabase**:

```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

O puedes usar las variables individuales de Vercel Postgres si las prefieres.

---

## Paso 8: Actualizar App URL en Shopify

1. Ve a tu app en Shopify Partners
2. **Configuration** → **App setup**
3. Actualiza:
   - **App URL**: `https://your-app.vercel.app`
   - **Allowed redirection URL(s)**: `https://your-app.vercel.app/api/auth/callback`

---

## Paso 9: Hacer Deploy

### Opción A: Desde Vercel Dashboard

1. **Deployments** → **Deploy**
2. O simplemente haz push a tu repositorio:
   ```bash
   git push origin main
   ```

### Opción B: Desde CLI

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod
```

---

## Paso 10: Verificar Despliegue

### 10.1 Verificar Build

1. Ve a **Deployments** en Vercel
2. Verifica que el build haya sido exitoso (✅)
3. Revisa los logs si hay errores

### 10.2 Verificar Variables de Entorno

1. **Settings** → **Environment Variables**
2. Verifica que todas las variables estén presentes
3. Asegúrate de que estén marcadas para **Production**, **Preview**, y **Development**

### 10.3 Verificar Base de Datos

1. Ve a **Storage** → Tu base de datos → **Data**
2. Verifica que las tablas existan:
   - `groups`
   - `group_members`
   - `invitations`
   - `discount_configs`
   - `appointments`
   - `branches`
   - `availability_slots`

---

## Paso 11: Instalar la App en una Tienda de Prueba

1. Ve a tu app en Shopify Partners
2. **Test on development store**
3. Selecciona una tienda de desarrollo
4. Autoriza los permisos
5. La app debería instalarse correctamente

---

## ✅ Checklist Final

- [ ] Proyecto creado en Vercel
- [ ] Base de datos configurada (Vercel Postgres o Supabase)
- [ ] Schema ejecutado en la base de datos
- [ ] App creada en Shopify Partners
- [ ] API credentials de Shopify configuradas
- [ ] Resend API key configurada
- [ ] Todas las variables de entorno configuradas en Vercel
- [ ] App URL actualizada en Shopify
- [ ] Deploy exitoso
- [ ] App instalada en tienda de prueba

---

## 🐛 Troubleshooting

### Error: "Environment variable not found"

**Solución**: Verifica que todas las variables estén configuradas en Vercel → Settings → Environment Variables

### Error: "Database connection failed"

**Solución**: 
1. Verifica que las variables de base de datos estén correctas
2. Si usas Supabase, verifica que la connection string incluya `?sslmode=require`

### Error: "Shopify API authentication failed"

**Solución**:
1. Verifica que `SHOPIFY_API_KEY` y `SHOPIFY_API_SECRET` sean correctos
2. Verifica que `SHOPIFY_APP_URL` coincida con tu URL de Vercel
3. Verifica que los scopes estén configurados correctamente

### Build falla en Vercel

**Solución**:
1. Revisa los logs del build en Vercel
2. Verifica que `package.json` tenga el script `build` correcto
3. Verifica que `next.config.js` esté configurado correctamente

---

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Shopify App Development](https://shopify.dev/docs/apps)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, tu app debería estar funcionando en:
`https://your-app.vercel.app`

