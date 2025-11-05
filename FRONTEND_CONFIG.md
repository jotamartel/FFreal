# 🎨 Configuración del Frontend

## ✅ Estado Actual

Ya estás viendo el dashboard desde Shopify, lo cual es excelente. Ahora necesitas configurar algunas variables para que App Bridge funcione completamente.

---

## 🔧 Variables de Entorno Necesarias

### Variables NEXT_PUBLIC (Frontend)

Estas variables son accesibles desde el navegador y son necesarias para el frontend:

#### 1. `NEXT_PUBLIC_APP_URL` ⭐ **IMPORTANTE**

**Descripción**: URL de tu aplicación (usada para generar links, emails, etc.)

**Valor**:
```
https://shopify-friends-family-app.vercel.app
```

**Dónde agregarla**:
- Vercel → Settings → Environment Variables
- Agregar como `NEXT_PUBLIC_APP_URL`

**Marca para**: ✅ Production, ✅ Preview, ✅ Development

#### 2. `NEXT_PUBLIC_SHOPIFY_API_KEY` ⭐ **IMPORTANTE**

**Descripción**: Client ID de tu app en Shopify (API Key pública)

**Cómo obtenerla**:
1. Ve a: https://partners.shopify.com
2. Selecciona tu app "Friends & Family Discount"
3. **Configuration** → **Client credentials**
4. Copia el **API Key** (Client ID)

**Valor**: `tu_api_key_de_shopify` (ejemplo: `25dc28fd997354031d2fdc97ba0d9e36`)

**Dónde agregarla**:
- Vercel → Settings → Environment Variables
- Agregar como `NEXT_PUBLIC_SHOPIFY_API_KEY`

**Marca para**: ✅ Production, ✅ Preview, ✅ Development

---

## 🎯 Qué Hace Cada Variable

### `NEXT_PUBLIC_APP_URL`
- Genera links de invitación por email
- Genera links de verificación
- Usada en redirecciones
- Usada en APIs que necesitan construir URLs absolutas

### `NEXT_PUBLIC_SHOPIFY_API_KEY`
- Inicializa Shopify App Bridge
- Permite comunicación con Shopify Admin
- Habilita navegación dentro del iframe de Shopify
- Necesaria para que la app funcione completamente integrada

---

## ✅ Checklist de Configuración

### Variables de Frontend
- [ ] `NEXT_PUBLIC_APP_URL` configurada
- [ ] `NEXT_PUBLIC_SHOPIFY_API_KEY` configurada

### Después de Configurar
- [ ] Redeploy realizado
- [ ] App probada desde Shopify Admin
- [ ] Navegación funcionando correctamente
- [ ] Links de invitación funcionando (si aplica)

---

## 🚀 Pasos Rápidos

### 1. Obtener API Key de Shopify

1. Ve a: https://partners.shopify.com
2. Tu app → **Configuration** → **Client credentials**
3. Copia el **API Key** (no el Secret)

### 2. Agregar Variables en Vercel

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables

2. Agrega `NEXT_PUBLIC_APP_URL`:
   - **Key**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://shopify-friends-family-app.vercel.app`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

3. Agrega `NEXT_PUBLIC_SHOPIFY_API_KEY`:
   - **Key**: `NEXT_PUBLIC_SHOPIFY_API_KEY`
   - **Value**: Tu API Key de Shopify
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 3. Redeploy

Después de agregar las variables:

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod
```

O desde el dashboard de Vercel: **Deployments** → **Redeploy**

---

## 🎨 Mejoras Implementadas

He actualizado el código para:

1. ✅ **ShopifyAppWrapper mejorado**: Ahora usa `AppBridgeProvider` correctamente
2. ✅ **Detección automática**: Detecta si está en Shopify y configura App Bridge
3. ✅ **Fallback**: Si no está en Shopify, funciona en modo standalone

---

## 🔍 Verificar que Funcione

Después del redeploy:

1. **Accede desde Shopify Admin**:
   - Apps → Tu app
   - Debería cargar sin errores

2. **Verifica la consola** (F12):
   - Deberías ver: "App Bridge configurado: { shop: '...', host: '...' }"
   - No debería haber errores de App Bridge

3. **Prueba la navegación**:
   - Click en "Groups" → Debería navegar correctamente
   - Click en "Config" → Debería navegar correctamente
   - Todas las rutas deberían funcionar

---

## 📝 Notas

- **NEXT_PUBLIC_***: Estas variables son públicas y accesibles desde el navegador
- **No expongas secrets**: Nunca uses `NEXT_PUBLIC_` para API secrets
- **Redeploy necesario**: Después de agregar variables NEXT_PUBLIC, necesitas redeploy

---

## ✅ Estado Final

Una vez configuradas estas variables:
- ✅ App Bridge funcionando completamente
- ✅ Navegación integrada con Shopify
- ✅ Links de invitación funcionando
- ✅ App completamente funcional

