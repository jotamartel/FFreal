# 🚀 Guía: Deploy de App Block Extension

## 📋 Pasos para Deployar la Extensión

### Paso 1: Configurar la App en Shopify Partners

Antes de deployar, necesitas:

1. **Crear o usar una app existente** en [Shopify Partners](https://partners.shopify.com)
2. **Obtener el Client ID** de tu app
3. **Configurar la app** en el proyecto

---

### Paso 2: Configurar el Proyecto

Ejecuta estos comandos:

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app

# 1. Login a Shopify (si no estás logueado)
shopify auth login

# 2. Link a tu app existente o crear nueva
shopify app config link
```

Cuando te pregunte:
- **What is your app's client ID?**: Ingresa el Client ID de tu app en Shopify Partners
- **Which development store would you like to use?**: Tu tienda de desarrollo

---

### Paso 3: Deploy de la Extensión

```bash
# Deploy solo la extensión
shopify app deploy --force
```

O si prefieres deployar todo:

```bash
# Deploy completo (app + extensiones)
shopify app deploy --force
```

---

### Paso 4: Activar en la Tienda

1. **Ve a Shopify Admin** → **Online Store** → **Themes**
2. **Customize** tu tema activo
3. **Agrega una sección** o edita una página
4. **Add section** → Busca **App blocks** → **Friends & Family Groups**
5. **Agrega el bloque**
6. **Configura**:
   - ✅ **Habilitar Friends & Family**: Activar
   - **URL de la App**: `https://shopify-friends-family-app.vercel.app`
7. **Save**

---

## 🔧 Si No Tienes App en Shopify Partners

### Opción 1: Crear Nueva App

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. **Apps** → **Create app**
3. Nombre: "Friends & Family Discount"
4. **App URL**: `https://shopify-friends-family-app.vercel.app/app`
5. **Allowed redirection URL(s)**: 
   - `https://shopify-friends-family-app.vercel.app/auth/callback`
6. Copia el **Client ID** y úsalo en `shopify app config link`

### Opción 2: Usar Link Directo (Más Simple)

Si prefieres no usar App Block, puedes:

1. **Agregar link en el menú** de la tienda:
   - **Online Store** → **Navigation**
   - Agrega link: "Friends & Family" → `https://shopify-friends-family-app.vercel.app/tienda`

Esto es más simple y no requiere deploy de extensiones.

---

## 📝 Estructura de la Extensión

```
extensions/
└── friends-family-app-block/
    ├── shopify.extension.toml    # Config de la extensión
    └── blocks/
        └── friends-family.liquid # Template Liquid
```

---

## ✅ Verificación

Después del deploy, verifica:

1. **En Shopify Partners** → Tu app → **Extensions**
   - Deberías ver "Friends & Family Groups" listada

2. **En Theme Customizer**:
   - Deberías poder agregar el bloque "Friends & Family Groups"

---

¿Quieres que te guíe para crear la app en Shopify Partners primero, o prefieres usar el link directo en el menú?

