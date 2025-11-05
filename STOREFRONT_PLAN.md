# 🏪 Plan: Storefront para Usuarios

## 🎯 Objetivo

Crear una página accesible desde la tienda de Shopify donde los usuarios puedan:
1. **Registrarse/Login** (sin necesidad de acceder al admin)
2. **Ver sus grupos** Friends & Family
3. **Crear nuevos grupos**
4. **Invitar miembros** a sus grupos
5. **Gestionar sus grupos** (agregar/eliminar miembros)

---

## 📋 Opciones de Implementación

### Opción 1: Página Pública en Next.js (Recomendada)

Crear una ruta pública `/tienda` o `/storefront` que:
- ✅ No requiere estar dentro de Shopify Admin
- ✅ Accesible desde cualquier navegador
- ✅ Puede ser linkeada desde la tienda de Shopify
- ✅ Funciona independientemente de Shopify

**Ventajas**:
- Fácil de implementar
- No requiere configuración de Shopify
- Accesible desde cualquier lugar

### Opción 2: Página en Shopify Storefront

Crear una página dentro de Shopify usando:
- Liquid templates
- Shopify App Embed
- Storefront API

**Ventajas**:
- Integrada con la tienda
- Usa el tema de la tienda
- Acceso a datos de Shopify

**Desventajas**:
- Más complejo
- Requiere configuración en Shopify

---

## 🚀 Recomendación: Opción 1

Crear una página pública `/tienda` que:
1. **Tenga un diseño similar a la tienda** pero funcional
2. **Use las mismas APIs** que ya tenemos
3. **Sea accesible públicamente** (no requiere Shopify Admin)
4. **Pueda ser linkeada desde la tienda** de Shopify

---

## 📁 Estructura Propuesta

```
app/
├── tienda/                    # Storefront público
│   ├── layout.tsx            # Layout con Polaris
│   ├── page.tsx              # Landing/Login
│   ├── dashboard/            # Dashboard de usuario
│   │   └── page.tsx          # Ver grupos
│   ├── grupos/
│   │   ├── page.tsx          # Lista de grupos
│   │   ├── nuevo/
│   │   │   └── page.tsx       # Crear grupo
│   │   └── [id]/
│   │       └── page.tsx       # Gestionar grupo
│   └── invitaciones/
│       └── [token]/
│           └── page.tsx       # Aceptar invitación
```

---

## 🎨 Diseño

- **Header simple** con logo y "Login" o nombre de usuario
- **Cards de grupos** similares a lo que ya tenemos
- **Formularios simples** para crear grupos e invitar
- **Responsive** para móvil y desktop

---

## 🔗 Integración con Shopify

1. **En la tienda de Shopify**:
   - Crear un link en el footer o menú
   - Ejemplo: "Friends & Family" → `https://shopify-friends-family-app.vercel.app/tienda`

2. **O usar un App Embed**:
   - Crear un App Embed que muestre un botón
   - El botón redirige a `/tienda`

---

## ✅ Ventajas de este Enfoque

- ✅ **No requiere Shopify Admin** - Los usuarios pueden acceder directamente
- ✅ **Funciona independientemente** - No depende de la configuración de Shopify
- ✅ **Reutiliza código existente** - Usa las mismas APIs y componentes
- ✅ **Fácil de mantener** - Todo en un solo lugar
- ✅ **Puede ser embebida** - Si quieres, puedes embebirla en Shopify

---

¿Quieres que implemente esta solución? Puedo crear las páginas del storefront público ahora mismo.

