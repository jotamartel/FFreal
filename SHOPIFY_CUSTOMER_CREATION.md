# 🛒 Creación Automática de Clientes en Shopify

## ✅ Funcionalidad Implementada

Cuando un usuario acepta una invitación o se une a un grupo usando un código de invitación, el sistema ahora:

1. ✅ **Crea automáticamente el cliente en Shopify** (si no existe)
2. ✅ **Crea un usuario en la app** (si no existe)
3. ✅ **Vincula ambas cuentas** (`shopify_customer_id` en la tabla `users`)
4. ✅ **Etiqueta el cliente en Shopify** con tags: `friends-family` y `group-{groupId}`

---

## 🔧 Configuración Requerida

### Variables de Entorno en Vercel

Agrega estas variables a tu proyecto en Vercel:

```env
# Shopify Store Domain (sin https://)
SHOPIFY_STORE_DOMAIN=infracommerce-latam.myshopify.com

# Shopify Admin API Access Token
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx

# Shopify API Version (opcional, default: 2024-10)
SHOPIFY_API_VERSION=2024-10
```

---

## 📋 Cómo Obtener el Admin API Access Token

### Opción 1: Desde Shopify Partners (Recomendado para Apps)

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. Selecciona tu app
3. Ve a **API credentials**
4. En **Admin API access scopes**, asegúrate de tener:
   - ✅ `read_customers`
   - ✅ `write_customers`
5. Copia el **Admin API access token**

### Opción 2: Crear un Private App (Para desarrollo rápido)

1. Ve a tu Shopify Admin: `https://admin.shopify.com/store/{tu-tienda}`
2. Ve a **Settings** → **Apps and sales channels**
3. Click en **Develop apps**
4. Click en **Create an app**
5. Nombre: "Friends & Family Admin API"
6. Click en **Configure Admin API scopes**
7. Selecciona:
   - ✅ `read_customers`
   - ✅ `write_customers`
8. Click en **Save**
9. Click en **Install app**
10. Copia el **Admin API access token** (empieza con `shpat_`)

---

## 🔄 Flujo Automático

### Cuando alguien acepta una invitación:

```
1. Usuario hace clic en el link de invitación
   ↓
2. Sistema busca/crea cliente en Shopify
   - Email: del invitado
   - Tags: ['friends-family', 'group-{id}']
   - Note: "Miembro del grupo Friends & Family: {nombre}"
   ↓
3. Sistema busca/crea usuario en la app
   - Email: del invitado
   - shopify_customer_id: ID del cliente de Shopify
   ↓
4. Sistema agrega al miembro al grupo
   - customer_id: ID de Shopify
   - user_id: ID del usuario de la app
   ↓
5. ✅ Todo vinculado y listo
```

### Cuando alguien se une con código:

```
1. Usuario ingresa código de invitación
   ↓
2. Sistema busca/crea cliente en Shopify
   ↓
3. Sistema busca/crea usuario en la app
   ↓
4. Sistema agrega al miembro al grupo
   ↓
5. ✅ Todo vinculado y listo
```

---

## 🎯 Beneficios

### Para el Negocio:
- ✅ **Clientes listos para aplicar descuentos**: Todos los miembros tienen cuenta en Shopify
- ✅ **Tracking completo**: Puedes ver quién pertenece a qué grupo desde Shopify Admin
- ✅ **Tags automáticos**: Fácil identificar clientes de Friends & Family
- ✅ **Sin trabajo manual**: Todo se crea automáticamente

### Para los Usuarios:
- ✅ **Sin registro manual**: Se crea automáticamente al aceptar invitación
- ✅ **Listo para comprar**: Pueden usar descuentos inmediatamente
- ✅ **Cuenta vinculada**: Su cuenta de la app está vinculada con Shopify

---

## 🔍 Verificación

### Verificar que funciona:

1. **Invita a alguien** desde la app
2. **Acepta la invitación** (o únete con código)
3. **Ve a Shopify Admin** → **Customers**
4. **Busca el email** del invitado
5. **Verifica**:
   - ✅ Cliente existe en Shopify
   - ✅ Tiene tags: `friends-family` y `group-{id}`
   - ✅ Tiene una nota con el nombre del grupo

### Verificar en la Base de Datos:

```sql
-- Ver usuarios vinculados
SELECT 
  u.email,
  u.shopify_customer_id,
  gm.group_id,
  g.name as group_name
FROM users u
JOIN ff_group_members gm ON u.id = gm.user_id
JOIN ff_groups g ON gm.group_id = g.id
WHERE u.shopify_customer_id IS NOT NULL;
```

---

## ⚠️ Manejo de Errores

El sistema está diseñado para ser **resiliente**:

- ✅ Si falla la creación en Shopify, **continúa** y agrega al grupo de todas formas
- ✅ Si el cliente ya existe en Shopify, **lo encuentra** y lo vincula
- ✅ Si el usuario ya existe en la app, **lo actualiza** con el `shopify_customer_id`
- ✅ Si no hay Admin API configurada, **funciona igual** (solo sin crear en Shopify)

**Logs**: Revisa los logs de Vercel para ver el proceso completo:
- `[acceptInvitation]` o `[joinGroupByCode]`
- `[SHOPIFY ADMIN]`

---

## 🚀 Próximos Pasos

Una vez configurado:

1. ✅ **Prueba invitando a alguien**
2. ✅ **Verifica que el cliente se crea en Shopify**
3. ✅ **Aplica descuentos automáticamente** usando el `shopify_customer_id`
4. ✅ **Monitorea los logs** para asegurar que todo funciona

---

## 📝 Notas Técnicas

- **Idempotente**: Puedes llamar la función múltiples veces sin crear duplicados
- **Tags en Shopify**: Se agregan automáticamente para facilitar segmentación
- **Usuarios temporales**: Si no existe usuario en la app, se crea uno con password temporal (el usuario puede completar registro después)
- **Fallback**: Si Shopify Admin API no está configurada, el sistema funciona igual pero sin crear clientes en Shopify

---

**¿Listo para configurar?** 🎯

