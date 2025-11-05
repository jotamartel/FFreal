# 🏪 Configurar App en Shopify Partners

## 📋 Pasos para Crear/Configurar la App

### Paso 1: Crear App en Shopify Partners

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. **Apps** → **Create app**
3. Completa:
   - **App name**: "Friends & Family Discount"
   - **App URL**: `https://shopify-friends-family-app.vercel.app/app`
   - **Allowed redirection URL(s)**: 
     - `https://shopify-friends-family-app.vercel.app/auth/callback`
     - `https://shopify-friends-family-app.vercel.app/api/auth/callback`
4. **Create app**

### Paso 2: Obtener Client ID

1. En la app recién creada, ve a **App setup**
2. Copia el **Client ID** (algo como: `25dc28fd997354031d2fdc97ba0d9e36`)

### Paso 3: Configurar en el Proyecto

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app

# Link a tu app
shopify app config link --client-id TU_CLIENT_ID_AQUI
```

O si prefieres hacerlo interactivo:

```bash
shopify app config link
```

Cuando te pregunte:
- **Client ID**: Pega el Client ID que copiaste
- **Store**: Tu tienda de desarrollo (ej: `infracommerce-latam.myshopify.com`)

---

## 🚀 Después de Configurar

Una vez configurado, puedes hacer deploy:

```bash
shopify app deploy --force
```

Esto subirá la extensión a tu app en Shopify Partners.

---

## ✅ Alternativa: Usar App Existente

Si ya tienes una app en Shopify Partners:

1. Ve a tu app en Shopify Partners
2. **App setup** → Copia el **Client ID**
3. Ejecuta: `shopify app config link --client-id TU_CLIENT_ID`

---

¿Tienes ya una app en Shopify Partners o necesitas crear una nueva?

