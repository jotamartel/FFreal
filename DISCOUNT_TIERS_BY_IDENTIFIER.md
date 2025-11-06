# Sistema de Descuentos por Identificador de Tier

## ✅ Implementación Completada

Se ha implementado un sistema completo que permite definir descuentos basados en `discount_tier_identifier` además de los descuentos basados en número de miembros.

## 🎯 Funcionalidad

### 1. Configuración de Tiers por Identificador

Desde la página **Configuración de Descuentos**, ahora puedes crear dos tipos de tiers:

#### **Tier por Número de Miembros** (Comportamiento Original)
- Se basa en la cantidad de miembros del grupo
- Ejemplo: "2 miembros → 5% descuento"
- Los grupos reciben el descuento que corresponde a su tamaño actual

#### **Tier por Identificador** (Nuevo)
- Se basa en el `discount_tier_identifier` asignado al usuario
- Ejemplo: "Tier: 1 (Básico) → 10% descuento"
- Los grupos creados por usuarios con ese identificador reciben ese descuento

### 2. Flujo Completo

```
1. Admin configura tiers en "Configuración de Descuentos"
   ├─ Tier por miembros: "2 miembros → 5%"
   └─ Tier por identificador: "Tier: 1 (Básico) → 10%"

2. Admin asigna identificador a usuario en "Gestión de Usuarios"
   └─ Usuario tiene discount_tier_identifier = "1"

3. Usuario crea grupo
   └─ El grupo se crea con discount_tier = 1 (del usuario)

4. Sistema calcula descuento
   ├─ Busca tier con tierIdentifier = "1"
   ├─ Si encuentra: aplica 10% descuento
   └─ Si no encuentra: busca por memberCount como fallback
```

## 📋 Cómo Usar

### Paso 1: Configurar Tiers por Identificador

1. Ve a **Configuración de Descuentos**
2. En la sección "Discount Tiers", selecciona **"Por identificador de tier"**
3. Completa:
   - **Identificador de Tier**: El valor que asignarás a usuarios (ej: "1", "2", "basic", "premium")
   - **Etiqueta (opcional)**: Nombre descriptivo (ej: "Básico", "Premium")
   - **Valor del Descuento**: Porcentaje o monto fijo
4. Haz clic en **"Agregar Nivel"**

### Paso 2: Asignar Identificador a Usuarios

1. Ve a **Gestión de Usuarios**
2. Para usuarios con `can_create_groups = true`, verás la sección "Configuración de Grupos"
3. Completa:
   - **Identificador de Nivel de Descuento**: Debe coincidir con el identificador configurado en el tier (ej: "1")
4. El valor se guarda automáticamente

### Paso 3: Verificar Funcionamiento

1. El usuario crea un grupo desde el frontend
2. El sistema usa su `discount_tier_identifier` para establecer el `discount_tier` del grupo
3. En el checkout, el sistema busca el tier correspondiente y aplica el descuento

## 🔍 Prioridad de Búsqueda

El sistema busca descuentos en este orden:

1. **Por `tierIdentifier`** (si el grupo tiene `discount_tier` configurado)
   - Busca un tier con `tierIdentifier` que coincida
   - Si encuentra, aplica ese descuento

2. **Por `memberCount`** (fallback)
   - Busca tiers con `memberCount` definido
   - Ordena por `memberCount` descendente
   - Aplica el tier que corresponde al tamaño del grupo

## 📊 Ejemplo de Configuración

### Tiers Configurados:

```json
[
  {
    "memberCount": 2,
    "discountValue": 5
  },
  {
    "memberCount": 4,
    "discountValue": 10
  },
  {
    "tierIdentifier": "1",
    "label": "Básico",
    "discountValue": 15
  },
  {
    "tierIdentifier": "2",
    "label": "Premium",
    "discountValue": 25
  }
]
```

### Usuarios:

- Usuario A: `discount_tier_identifier = "1"` → Sus grupos tendrán 15% descuento
- Usuario B: `discount_tier_identifier = "2"` → Sus grupos tendrán 25% descuento
- Usuario C: `discount_tier_identifier = null` → Sus grupos usarán descuentos por tamaño (5% con 2 miembros, 10% con 4+ miembros)

## ⚠️ Notas Importantes

1. **Coincidencia de Identificadores**: El `discount_tier_identifier` del usuario debe coincidir exactamente con el `tierIdentifier` configurado en los tiers.

2. **Compatibilidad**: Los tiers por `memberCount` siguen funcionando como antes. Puedes tener ambos tipos en la misma configuración.

3. **Prioridad**: Si un grupo tiene `discount_tier` configurado, el sistema busca primero por `tierIdentifier`. Si no encuentra, usa `memberCount` como fallback.

4. **Migración**: Los tiers existentes basados en `memberCount` seguirán funcionando sin cambios.

