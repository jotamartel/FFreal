# ✅ Configuración Final - Creación Automática de Clientes

## 🎯 Estado Actual

Ya tienes configurados los permisos en Shopify Partners:
- ✅ `read_customers`
- ✅ `write_customers`

Ahora solo necesitas configurar las variables de entorno en Vercel.

---

## 📋 Variables Requeridas en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables** y agrega/verifica estas variables:

```env
# Shopify Store Domain (sin https://)
SHOPIFY_STORE_DOMAIN=infracommerce-latam.myshopify.com

# Shopify Admin API Access Token (obtener de Shopify Partners)
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx

# Shopify API Version (opcional, default: 2024-10)
SHOPIFY_API_VERSION=2024-10
```

---

## 🔑 Cómo Obtener el Admin API Access Token

### Desde Shopify Partners:

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. Selecciona tu app "Friends & Family" (o el nombre de tu app)
3. Ve a **API credentials**
4. En la sección **Admin API access scopes**, deberías ver:
   - ✅ `read_customers`
   - ✅ `write_customers`
5. Copia el **Admin API access token** (empieza con `shpat_`)
6. Agrégala a Vercel como `SHOPIFY_ADMIN_API_ACCESS_TOKEN`

---

## ✅ Checklist de Configuración

- [ ] `SHOPIFY_STORE_DOMAIN` configurada en Vercel
- [ ] `SHOPIFY_ADMIN_API_ACCESS_TOKEN` configurada en Vercel
- [ ] `SHOPIFY_API_VERSION` configurada (opcional, default: 2024-10)
- [ ] Permisos `read_customers` y `write_customers` activos en Shopify Partners
- [ ] Variables guardadas en Vercel
- [ ] Aplicación redeployada (automático o manual)

---

## 🧪 Probar la Funcionalidad

Una vez configurado:

1. **Invita a alguien** desde la app
2. **Acepta la invitación** (o únete con código)
3. **Verifica en Shopify Admin**:
   - Ve a **Customers**
   - Busca el email del invitado
   - Deberías ver:
     - ✅ Cliente creado
     - ✅ Tags: `friends-family` y `group-{id}`
     - ✅ Nota con el nombre del grupo

4. **Verifica en los logs de Vercel**:
   - Busca logs con `[SHOPIFY ADMIN]`
   - Deberías ver: `✅ Shopify customer created/found: {id}`

---

## 🔍 Verificación Rápida

### Endpoint de prueba (opcional):

Puedes crear un endpoint de prueba para verificar la configuración:

```bash
# GET /api/debug/shopify-admin-config
```

Este endpoint mostraría:
- ✅ Si `SHOPIFY_STORE_DOMAIN` está configurado
- ✅ Si `SHOPIFY_ADMIN_API_ACCESS_TOKEN` está configurado
- ✅ Si los permisos están correctos

---

## ⚠️ Notas Importantes

1. **El token es sensible**: No lo compartas ni lo subas a repositorios públicos
2. **Fallback automático**: Si no está configurado, el sistema funciona igual pero sin crear clientes en Shopify
3. **Idempotente**: Puedes llamar la función múltiples veces sin crear duplicados
4. **Logs detallados**: Revisa los logs de Vercel para ver el proceso completo

---

## 🚀 Siguiente Paso

Una vez que agregues `SHOPIFY_ADMIN_API_ACCESS_TOKEN` a Vercel:

1. Espera el redeploy automático (o hazlo manualmente)
2. Prueba invitando a alguien
3. Verifica que el cliente se crea en Shopify
4. ¡Listo! 🎉

---

**¿Necesitas ayuda para obtener el token o prefieres hacerlo tú?** 🎯

