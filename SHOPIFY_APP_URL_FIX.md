# 🔧 Configurar App URL Correcta en Shopify

## 🔍 Problema Actual

Estás viendo la página de inicio simple en lugar del dashboard de administración. Esto ocurre porque Shopify está apuntando a la raíz `/` en lugar de `/app`.

## ✅ Solución

### Actualizar App URL en Shopify Partners

La app necesita apuntar a la ruta `/app` para mostrar el dashboard integrado con Shopify App Bridge.

1. **Ve a Shopify Partners**:
   - https://partners.shopify.com
   - Selecciona tu app "Friends & Family Discount"

2. **Ve a Configuration → App setup**

3. **Actualiza App URL**:
   ```
   https://shopify-friends-family-app.vercel.app/app
   ```
   
   ⚠️ **IMPORTANTE**: Agrega `/app` al final de la URL

4. **Allowed redirection URL(s)**:
   ```
   https://shopify-friends-family-app.vercel.app/api/auth/callback
   ```

5. **Verifica que "Embedded app" esté activado**

6. **Click Save**

### Actualizar Variables de Entorno (Si es necesario)

Si tienes `SHOPIFY_APP_URL` en Vercel, también deberías actualizarla:

1. Ve a: https://vercel.com/julianmartel-infracommercs-projects/shopify-friends-family-app/settings/environment-variables

2. Si existe `SHOPIFY_APP_URL`, actualízala a:
   ```
   https://shopify-friends-family-app.vercel.app
   ```
   (Sin `/app` al final - eso es solo para la App URL en Shopify Partners)

3. `NEXT_PUBLIC_APP_URL` debe ser:
   ```
   https://shopify-friends-family-app.vercel.app
   ```

---

## 🎯 Qué Deberías Ver

Después de actualizar, cuando accedas a la app desde Shopify Admin deberías ver:

1. **Dashboard completo** con:
   - Título: "Friends & Family Dashboard"
   - Subtítulo: "Manage discount groups and appointments"
   - Cards de acceso rápido:
     - Groups
     - Discount Config
     - Appointments
     - Analytics

2. **Interfaz Polaris** (el diseño de Shopify)

3. **Navegación funcional** a todas las secciones

---

## 📋 Rutas Disponibles

Una vez configurado correctamente, puedes acceder a:

| Ruta | Descripción |
|------|-------------|
| `/app` | Dashboard principal |
| `/app/groups` | Gestión de grupos |
| `/app/config` | Configuración de descuentos |
| `/app/appointments` | Gestión de citas |
| `/app/analytics` | Analytics y estadísticas |

---

## 🔄 Después de Actualizar

1. **Guarda los cambios** en Shopify Partners
2. **Espera 1-2 minutos** para que se propague
3. **Recarga la app** en Shopify Admin (Cmd+R o F5)
4. **Deberías ver** el dashboard completo ahora

---

## 🐛 Si Sigue Sin Funcionar

1. **Verifica la consola** del navegador (F12) para ver errores
2. **Limpia la caché** del navegador
3. **Verifica los logs** de Vercel para ver si hay errores del servidor
4. **Confirma** que la URL en Shopify Partners sea exactamente:
   ```
   https://shopify-friends-family-app.vercel.app/app
   ```

---

## ✅ Checklist

- [ ] App URL actualizada en Shopify Partners a `/app`
- [ ] Redirect URL configurada correctamente
- [ ] Embedded app activado
- [ ] Variables de entorno actualizadas en Vercel (si es necesario)
- [ ] App recargada en Shopify Admin
- [ ] Dashboard visible correctamente

