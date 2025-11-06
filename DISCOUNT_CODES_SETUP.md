# 🎟️ Sistema de Cupones de Descuento - Configuración

## ✅ Funcionalidad Implementada

Cuando se crea un grupo de Friends & Family, el sistema ahora:

1. ✅ **Calcula el descuento** basado en el tier configurado
2. ✅ **Crea automáticamente un cupón en Shopify** con ese descuento
3. ✅ **Almacena el código del cupón** en la base de datos
4. ✅ **Vincula el cupón con el grupo** para fácil acceso

---

## 🔧 Configuración Requerida

### 1. Ejecutar Migración SQL

Primero, necesitas agregar la columna `discount_code` a la tabla `ff_groups`:

**En Supabase SQL Editor o tu cliente de PostgreSQL:**

```sql
-- Ejecuta este script
-- Archivo: lib/database/schema_discount_code.sql

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ff_groups' 
    AND column_name = 'discount_code'
  ) THEN
    ALTER TABLE ff_groups 
    ADD COLUMN discount_code VARCHAR(50);
    
    CREATE INDEX IF NOT EXISTS idx_ff_groups_discount_code 
    ON ff_groups(discount_code);
  END IF;
END $$;
```

### 2. Verificar Permisos en Shopify Partners

Asegúrate de tener estos permisos en Shopify Partners:

- ✅ `read_customers`
- ✅ `write_customers`
- ✅ `read_discounts` (nuevo)
- ✅ `write_discounts` (nuevo)

**Para agregar permisos de descuentos:**

1. Ve a [Shopify Partners](https://partners.shopify.com)
2. Selecciona tu app
3. Ve a **API credentials**
4. En **Admin API access scopes**, agrega:
   - `read_discounts`
   - `write_discounts`
5. Guarda los cambios

### 3. Variables de Entorno

Asegúrate de tener estas variables en Vercel:

```env
SHOPIFY_STORE_DOMAIN=infracommerce-latam.myshopify.com
SHOPIFY_ADMIN_API_ACCESS_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxx
SHOPIFY_API_VERSION=2024-10
```

---

## 🎯 Cómo Funciona

### Flujo Automático:

```
1. Usuario crea un grupo
   ↓
2. Sistema calcula descuento basado en tier
   ↓
3. Sistema crea cupón en Shopify
   - Código: FF{6 dígitos del invite_code}
   - Descuento: Basado en tier configurado
   - Título: "Friends & Family: {nombre del grupo}"
   ↓
4. Sistema guarda código en base de datos
   ↓
5. ✅ Cupón listo para usar
```

### Formato del Código:

- **Prefijo**: `FF` (Friends & Family)
- **Sufijo**: Primeros 6 caracteres del `invite_code`
- **Ejemplo**: `FFA1B2C3`

---

## 📋 Endpoints Disponibles

### Obtener Código de Descuento de un Grupo

```http
GET /api/groups/{groupId}/discount-code
```

**Response:**
```json
{
  "groupId": "uuid",
  "groupName": "Mi Familia",
  "discountCode": "FFA1B2C3",
  "discountTier": 1
}
```

---

## 🔍 Verificación

### Verificar que funciona:

1. **Crea un grupo** desde la app
2. **Verifica en Shopify Admin**:
   - Ve a **Discounts**
   - Busca el cupón con código `FF...`
   - Verifica que el descuento sea correcto
3. **Verifica en la base de datos**:
   ```sql
   SELECT id, name, discount_code, discount_tier 
   FROM ff_groups 
   WHERE discount_code IS NOT NULL;
   ```

### Verificar en los logs:

Busca en los logs de Vercel:
- `[createGroup] Creating discount code in Shopify`
- `[SHOPIFY ADMIN] Discount code created successfully`

---

## 🎨 Personalización

### Cambiar el Prefijo del Código:

Edita `lib/database/ff-groups.ts` línea ~85:

```typescript
const discountCodePrefix = 'FF'; // Cambia a lo que prefieras
```

### Restringir a Clientes Específicos:

En `lib/database/ff-groups.ts`, puedes modificar:

```typescript
customerSelection: 'specific',
customerIds: [/* IDs de clientes del grupo */],
```

---

## ⚠️ Notas Importantes

1. **Idempotente**: Si el cupón ya existe, no se crea duplicado
2. **Resiliente**: Si falla la creación del cupón, el grupo se crea igual
3. **Actualización**: Los cupones NO se actualizan automáticamente cuando cambia el tier (funcionalidad futura)
4. **Límites**: Shopify tiene límites en la cantidad de cupones activos

---

## 🚀 Próximos Pasos

Una vez configurado:

1. ✅ **Ejecuta la migración SQL**
2. ✅ **Agrega permisos de descuentos en Shopify Partners**
3. ✅ **Prueba creando un grupo**
4. ✅ **Verifica que el cupón se crea en Shopify**
5. ✅ **Comparte el código con los miembros del grupo**

---

## 📝 Ejemplo de Uso

```typescript
// Obtener código de descuento de un grupo
const response = await fetch(`/api/groups/${groupId}/discount-code`);
const { discountCode } = await response.json();

// Mostrar al usuario
console.log(`Tu código de descuento: ${discountCode}`);
```

---

**¿Listo para configurar?** 🎯

