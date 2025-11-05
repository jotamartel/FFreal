# ⚡ Deploy Rápido de Extensión

## 🎯 Opción 1: Si Ya Tienes App en Shopify Partners

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app

# 1. Link a tu app (reemplaza CLIENT_ID con tu Client ID real)
shopify app config link --client-id CLIENT_ID

# 2. Deploy la extensión
shopify app deploy --force
```

---

## 🎯 Opción 2: Crear Nueva App Primero

1. **Crea la app** en [Shopify Partners](https://partners.shopify.com)
2. **Obtén el Client ID**
3. **Ejecuta**:
```bash
shopify app config link --client-id TU_CLIENT_ID
shopify app deploy --force
```

---

## 🎯 Opción 3: Link Directo (Sin Extensión)

Si prefieres no usar App Block, puedes agregar un link directo en el menú:

1. **Shopify Admin** → **Online Store** → **Navigation**
2. **Agrega link**:
   - Texto: "Friends & Family"
   - URL: `https://shopify-friends-family-app.vercel.app/tienda`
3. **Save**

Esto es más simple y funciona inmediatamente sin necesidad de deploy.

---

## 📝 ¿Qué Prefieres?

1. **Crear nueva app** en Shopify Partners
2. **Usar app existente** (si tienes el Client ID)
3. **Link directo** en el menú (más simple)

¿Cuál prefieres?

