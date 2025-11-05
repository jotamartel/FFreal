# 🏪 Integración con App Block de Shopify

## 🎯 Objetivo

Crear un **App Block** de Shopify que permita a los usuarios gestionar sus grupos Friends & Family directamente desde la tienda, sin necesidad de acceder al admin.

---

## ✅ Implementación

### 1. Estructura Creada

```
extensions/
└── friends-family-app-block/
    ├── shopify.extension.toml    # Configuración de la extensión
    └── blocks/
        └── friends-family.liquid # Template Liquid para el App Block
```

### 2. Cómo Funciona

1. **El App Block** se agrega a cualquier página del tema
2. **Carga un iframe** que apunta a `/tienda`
3. **Los usuarios** pueden:
   - Registrarse/Login
   - Ver sus grupos
   - Crear grupos
   - Invitar miembros
   - Gestionar sus grupos

---

## 🚀 Pasos para Activar

### Paso 1: Deploy de la Extensión

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app

# Si tienes Shopify CLI instalado:
shopify app deploy
```

### Paso 2: Agregar a una Página

1. Ve a **Shopify Admin** → **Online Store** → **Pages**
2. Crea una nueva página o edita una existente
3. Click **Add section**
4. Busca **"Friends & Family Groups"** en App blocks
5. Agrega el bloque
6. Configura:
   - ✅ **Habilitar Friends & Family**: Activar
   - **URL de la App**: `https://shopify-friends-family-app.vercel.app`
7. **Save**

### Paso 3: Agregar al Menú

1. Ve a **Online Store** → **Navigation**
2. Edita tu menú principal
3. Agrega un link a la página que creaste
4. Ejemplo: "Friends & Family" → `/pages/friends-family`

---

## 📋 Alternativa: App Embed (Más Simple)

Si prefieres que aparezca en todas las páginas automáticamente:

### Crear App Embed

1. Crea un archivo `extensions/friends-family-embed/shopify.extension.toml`:

```toml
api_version = "2024-10"

[[extensions]]
type = "app_embed"
name = "Friends & Family Embed"
handle = "friends-family-embed"
```

2. Crea `extensions/friends-family-embed/blocks/app-embed.liquid`:

```liquid
{% if block.settings.enabled %}
  <div id="friends-family-embed" style="position: fixed; bottom: 20px; right: 20px; z-index: 999999;">
    <a href="{{ block.settings.app_url }}/tienda" 
       style="background: #667eea; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
      Friends & Family
    </a>
  </div>
{% endif %}

{% schema %}
{
  "name": "Friends & Family",
  "target": "body",
  "settings": [
    {
      "type": "checkbox",
      "id": "enabled",
      "label": "Enable Friends & Family",
      "default": true
    },
    {
      "type": "text",
      "id": "app_url",
      "label": "App URL",
      "default": "https://shopify-friends-family-app.vercel.app"
    }
  ]
}
{% endschema %}
```

3. Activar en **Theme Customizer** → **App embeds** → **Friends & Family**

---

## 🎨 Opciones de Integración

### Opción 1: App Block (Recomendada)
- ✅ Se agrega a páginas específicas
- ✅ Puede configurarse por página
- ✅ Más control sobre dónde aparece

### Opción 2: App Embed
- ✅ Aparece en todas las páginas
- ✅ Puede ser un botón flotante
- ✅ Más simple de configurar

### Opción 3: Link Directo
- ✅ Agregar link en el footer/menú
- ✅ Link directo a `/tienda`
- ✅ Más simple, sin extensiones

---

## 🔗 URL Pública

La página `/tienda` es:
- ✅ **Pública** (no requiere autenticación para ver)
- ✅ **Accesible** desde cualquier navegador
- ✅ **Puede ser linkeada** desde la tienda
- ✅ **Funciona independientemente** de Shopify

**URL**: `https://shopify-friends-family-app.vercel.app/tienda`

---

## 📝 Próximos Pasos

1. **Elegir método**:
   - App Block (para páginas específicas)
   - App Embed (para todas las páginas)
   - Link directo (más simple)

2. **Deploy la extensión** (si usas App Block/Embed)

3. **Probar** desde la tienda

---

¿Quieres que cree el App Embed también, o prefieres usar solo el App Block?

