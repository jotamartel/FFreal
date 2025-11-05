# 🔧 Solución: "refused to connect" en Shopify

## 🔍 Problema Identificado

El error "refused to connect" ocurre porque:
1. Shopify está configurado para usar: `shopify-friends-family-evnenjcg4.vercel.app` (URL antigua)
2. Cada nuevo deploy en Vercel genera una nueva URL temporal
3. La URL antigua ya no está activa

## ✅ Solución: Usar el Alias Estable

Vercel mantiene un **alias estable** que siempre apunta al último deployment:

**URL estable**: `https://shopify-friends-family-app.vercel.app`

Esta URL **no cambia** entre deploys, así que es perfecta para configurar en Shopify.

---

## 🔧 Pasos para Corregir

### Paso 1: Verificar la URL Estable

La URL estable debería ser:
```
https://shopify-friends-family-app.vercel.app
```

Prueba acceder a esta URL directamente en tu navegador para confirmar que funciona.

### Paso 2: Actualizar en Shopify Partners

1. Ve a: https://partners.shopify.com
2. Selecciona tu app "Friends & Family Discount" (o el nombre que le pusiste)
3. Ve a **Configuration** → **App setup**
4. Actualiza estos campos:

#### App URL:
```
https://shopify-friends-family-app.vercel.app
```

#### Allowed redirection URL(s):
```
https://shopify-friends-family-app.vercel.app/api/auth/callback
```

5. Click **Save**

### Paso 3: Actualizar Variables de Entorno en Vercel

Si todavía tienes la URL antigua en las variables, actualízalas:

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables

2. Actualiza estas variables:

**SHOPIFY_APP_URL**:
```
https://shopify-friends-family-app.vercel.app
```

**NEXT_PUBLIC_APP_URL**:
```
https://shopify-friends-family-app.vercel.app
```

3. Click **Save** en cada una

### Paso 4: Redeploy (Opcional pero Recomendado)

Después de actualizar las variables:

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/deployments
2. Click en el último deployment → **Redeploy**

O desde terminal:
```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod
```

### Paso 5: Verificar en Shopify

1. Ve a tu Shopify Admin
2. **Apps** → Tu app
3. Debería cargar correctamente ahora

---

## 🔍 Verificar que la URL Funcione

Antes de configurar en Shopify, prueba acceder directamente:

1. Abre: https://shopify-friends-family-app.vercel.app
2. Debería cargar la aplicación sin errores
3. Si ves algún error, compártelo para solucionarlo

---

## 📝 URLs Correctas

| Tipo | URL |
|------|-----|
| **App URL** (para Shopify) | `https://shopify-friends-family-app.vercel.app` |
| **Redirect URL** (para Shopify) | `https://shopify-friends-family-app.vercel.app/api/auth/callback` |
| **SHOPIFY_APP_URL** (variable) | `https://shopify-friends-family-app.vercel.app` |
| **NEXT_PUBLIC_APP_URL** (variable) | `https://shopify-friends-family-app.vercel.app` |

---

## ⚠️ Nota Importante

- **NO uses** las URLs temporales como `shopify-friends-family-9xyw6af5i.vercel.app`
- **SÍ usa** el alias estable `shopify-friends-family-app.vercel.app`
- El alias siempre apunta al último deployment, así que no necesitas cambiarlo después

---

## 🐛 Si Sigue Sin Funcionar

1. **Verifica que la app esté instalada** en tu tienda
2. **Limpia la caché** del navegador (Cmd+Shift+R)
3. **Revisa la consola** del navegador (F12) para ver errores específicos
4. **Verifica los logs** de Vercel para ver si hay errores del servidor

---

## ✅ Checklist

- [ ] URL estable verificada y funcionando
- [ ] App URL actualizada en Shopify Partners
- [ ] Redirect URL actualizada en Shopify Partners
- [ ] SHOPIFY_APP_URL actualizada en Vercel
- [ ] NEXT_PUBLIC_APP_URL actualizada en Vercel
- [ ] Redeploy realizado
- [ ] App probada desde Shopify Admin

