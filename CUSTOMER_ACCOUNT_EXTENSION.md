# Extensión de Customer Account para Friends & Family

## ✅ Extensión Creada

Se ha creado una extensión de Customer Account UI que permite a los clientes ver y gestionar sus grupos de Friends & Family directamente desde su cuenta de Shopify.

## 📍 Ubicación

La extensión se encuentra en:
```
extensions/friends-family-customer-account/
```

## 🎯 Target Configurado

- **Target**: `customer-account.profile.block.render`
- **Ubicación**: Página de Perfil del cliente
- **Placement**: `PROFILE1` (primera posición disponible)

## 🚀 Cómo Desplegar

### Paso 1: Deploy de la Extensión

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
shopify app deploy
```

Esto desplegará la extensión a tu app de Shopify.

### Paso 2: Activar en Customer Accounts

1. Ve a **Settings** → **Customer accounts** en tu Shopify Admin
2. Asegúrate de que estés usando la nueva versión de Customer Accounts (no la legacy)
3. La extensión debería aparecer automáticamente como un bloque disponible en la página de perfil

### Paso 3: Configurar el Bloque (Merchant)

1. Ve a **Settings** → **Customer accounts**
2. Click en **Customize** en la página de perfil
3. En el panel izquierdo, deberías ver **"Friends & Family"** como un bloque disponible
4. Arrástralo a la posición deseada (PROFILE1 o PROFILE2)
5. **Save**

## 📋 Funcionalidades

La extensión muestra:
- ✅ Lista de grupos activos del cliente
- ✅ Información de cada grupo (miembros, descuento, código de invitación)
- ✅ Botones para gestionar grupos o crear nuevos
- ✅ Estado de carga y manejo de errores

## 🔧 Configuración Técnica

### Archivos Principales

- `shopify.extension.toml`: Configuración de la extensión
- `src/ProfileBlock.jsx`: Componente principal de la extensión
- `locales/en.default.json`: Traducciones

### Network Access

La extensión tiene `network_access = true` habilitado para poder hacer llamadas a tu API en Vercel.

### API Endpoint

La extensión llama a:
```
GET https://shopify-friends-family-app.vercel.app/api/customer/group
```

Esta API obtiene los grupos del usuario autenticado usando la sesión (cookies JWT).

## ⚠️ Notas Importantes

1. **Autenticación**: La extensión usa `shopify.sessionToken.get()` para obtener el token de sesión del cliente y lo envía a tu API. Tu API debe validar este token.

2. **CORS**: Tu API debe estar configurada para aceptar requests desde los dominios de Shopify Customer Accounts.

3. **URLs**: Los botones en la extensión apuntan a tu aplicación en Vercel. Si cambias la URL, actualiza el componente `ProfileBlock.jsx`.

## 🎨 Personalización

Puedes modificar el componente en:
```
extensions/friends-family-customer-account/src/ProfileBlock.jsx
```

Para cambiar:
- Estilos y layout
- Información mostrada
- Acciones disponibles
- Textos y traducciones

## 📚 Documentación

- [Customer Account UI Extensions](https://shopify.dev/docs/api/customer-account-ui-extensions)
- [Extension Targets](https://shopify.dev/docs/api/customer-account-ui-extensions/targets)
- [Polaris Web Components](https://shopify.dev/docs/api/customer-account-ui-extensions/polaris-web-components)

