# Cómo Obtener SHOPIFY_API_SECRET

## Pasos Detallados

### Opción 1: Desde Shopify Partners Dashboard

1. **Accede a Shopify Partners:**
   - Ve a: https://partners.shopify.com
   - Inicia sesión con tu cuenta

2. **Navega a tu app:**
   - En el menú lateral, haz clic en "Apps"
   - Busca y selecciona tu app: **"Friends-Family-Discount"**

3. **Ve a API credentials:**
   - En el menú de la app, busca la sección **"API credentials"** o **"App setup"**
   - O ve directamente a: https://partners.shopify.com/{tu-usuario}/apps/{app-id}/api-credentials

4. **Copia el Client secret:**
   - Encontrarás dos valores:
     - **Client ID**: `7e302a04c4c9857db921e5dca73ddd26` (ya lo tienes)
     - **Client secret**: Este es el que necesitas (es un string largo, similar a: `shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)
   - Haz clic en "Reveal" o "Show" para ver el Client secret
   - **Copia este valor** (es importante, no lo compartas públicamente)

### Opción 2: Desde Shopify CLI (si lo tienes instalado)

```bash
# Si tienes Shopify CLI instalado y configurado
shopify app info
```

Esto mostrará la información de la app, pero puede que no muestre el secret completo.

### Opción 3: Verificar en shopify.app.toml

El `shopify.app.toml` solo contiene el `client_id`, no el `client_secret` por razones de seguridad.

## Configuración en Vercel

Una vez que tengas el Client secret:

1. **Ve a Vercel:**
   - https://vercel.com
   - Selecciona tu proyecto: `shopify-friends-family-app`

2. **Agrega la variable de entorno:**
   - Settings → Environment Variables
   - Haz clic en "Add New"
   - Nombre: `SHOPIFY_API_SECRET`
   - Valor: (pega el Client secret que copiaste)
   - Selecciona todos los entornos: Production, Preview, Development

3. **Redeploy:**
   - Vercel hará un redeploy automático
   - O puedes hacerlo manualmente desde el dashboard

## Verificación

Después de configurar, puedes verificar en los logs de Vercel que el secret esté configurado:

```bash
vercel logs https://shopify-friends-family-app.vercel.app --since 5m | grep -i "shopify.*secret"
```

Deberías ver en los logs algo como:
```
[shopify-session] hasApiSecretKey: true
```

## Nota de Seguridad

⚠️ **IMPORTANTE**: El Client secret es información sensible. No lo compartas:
- En repositorios públicos
- En mensajes de chat públicos
- En screenshots
- En logs públicos

Solo úsalo en:
- Variables de entorno en Vercel (ya están encriptadas)
- Archivos `.env` locales (que están en `.gitignore`)

## Si No Puedes Encontrarlo

Si no encuentras el Client secret en Partners Dashboard:

1. **Puede que necesites regenerarlo:**
   - En la sección de API credentials, busca la opción "Regenerate secret"
   - ⚠️ Si regeneras, tendrás que actualizar todas las configuraciones que usen el secret anterior

2. **Verifica que tengas permisos:**
   - Asegúrate de ser el owner o tener permisos de administrador en la app
   - Si no eres el owner, contacta al propietario de la app

