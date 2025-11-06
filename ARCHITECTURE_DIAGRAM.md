# 🏗️ Arquitectura y Funcionalidades - Friends & Family App

## 📊 Diagrama General del Sistema

```mermaid
graph TB
    subgraph "Frontend"
        A[Shopify Admin Dashboard] --> B[Admin Panel]
        C[Customer Account Extension] --> D[Customer Portal]
        E[Storefront App Block] --> F[Public Storefront]
    end
    
    subgraph "Backend API"
        G[Next.js API Routes]
        H[Authentication]
        I[Groups Management]
        J[Invitations]
        K[Discount Calculation]
        L[User Management]
    end
    
    subgraph "Database"
        M[(PostgreSQL/Supabase)]
        N[Groups Table]
        O[Group Members]
        P[Invitations]
        Q[Users]
        R[Discount Config]
    end
    
    subgraph "External Services"
        S[Resend Email]
        T[Shopify Session Tokens]
    end
    
    B --> G
    D --> G
    F --> G
    G --> H
    G --> I
    G --> J
    G --> K
    G --> L
    I --> M
    J --> M
    L --> M
    M --> N
    M --> O
    M --> P
    M --> Q
    M --> R
    J --> S
    D --> T
    C --> T
```

## 🔄 Flujos Principales

### 1. Flujo de Creación de Grupo

```mermaid
sequenceDiagram
    participant U as Usuario
    participant CA as Customer Account Extension
    participant API as API Backend
    participant DB as Database
    participant Email as Resend
    
    U->>CA: Click "Crear Grupo"
    CA->>API: POST /api/groups (con session token)
    API->>API: Validar permisos (can_create_groups)
    API->>DB: Obtener user.max_members_per_group
    API->>DB: Obtener config.max_members_default
    API->>DB: Obtener user.discount_tier_identifier
    API->>DB: Crear grupo con max_members y discount_tier
    DB-->>API: Grupo creado con invite_code
    API-->>CA: Grupo creado exitosamente
    CA->>CA: Refrescar lista de grupos
    CA-->>U: Mostrar grupo creado
```

### 2. Flujo de Invitación

```mermaid
sequenceDiagram
    participant Owner as Propietario
    participant CA as Customer Account Extension
    participant API as API Backend
    participant DB as Database
    participant Email as Resend
    participant Invitee as Invitado
    
    Owner->>CA: Click "Invitar a alguien"
    CA->>CA: Mostrar formulario de email
    Owner->>CA: Ingresar email del invitado
    CA->>API: POST /api/invitations
    API->>DB: Crear invitación
    DB-->>API: Invitación creada
    API->>DB: Obtener grupo (invite_code)
    API->>Email: Enviar email de invitación
    alt Email enviado exitosamente
        Email-->>API: Email enviado
        API-->>CA: {invitation, emailSent: true}
        CA-->>Owner: ✅ Invitación enviada
    else Email falla (dominio no verificado)
        Email-->>API: Error 403
        API-->>CA: {invitation, emailSent: false, emailError: "..."}
        CA-->>Owner: ⚠️ Invitación creada, código: XXX
    end
    
    Invitee->>Email: Recibe email con código
    Invitee->>CA: Click en link /tienda/unirse?code=XXX
    CA->>API: POST /api/invitations/join-by-code
    API->>DB: Buscar grupo por invite_code
    API->>DB: Verificar límite de miembros
    API->>DB: Agregar miembro al grupo
    DB-->>API: Miembro agregado
    API-->>CA: Unión exitosa
    CA-->>Invitee: ✅ Te uniste al grupo
```

### 3. Flujo de Autenticación

```mermaid
sequenceDiagram
    participant U as Usuario
    participant Login as Login Page
    participant API as Auth API
    participant DB as Database
    participant Session as JWT Session
    
    U->>Login: Ingresar email/password
    Login->>API: POST /api/auth/login
    API->>DB: Verificar credenciales
    DB-->>API: Usuario válido
    API->>Session: Crear JWT token
    Session-->>API: Token creado
    API-->>Login: Set-Cookie: auth-token
    Login->>Login: Redirigir a /customer
    Login-->>U: Dashboard de grupos
```

### 4. Flujo de Cálculo de Descuento

```mermaid
flowchart TD
    A[Checkout con código de grupo] --> B{¿Grupo válido?}
    B -->|No| C[Sin descuento]
    B -->|Sí| D{¿Tiene discount_tier?}
    D -->|Sí| E[Buscar tier por tierIdentifier]
    D -->|No| F[Buscar tier por memberCount]
    E --> G{¿Tier encontrado?}
    F --> G
    G -->|Sí| H[Aplicar descuento del tier]
    G -->|No| I[Sin descuento]
    H --> J[Actualizar checkout]
    I --> J
    C --> J
```

## 🎯 Funcionalidades por Módulo

### Admin Dashboard

```mermaid
graph LR
    A[Admin Dashboard] --> B[Gestión de Grupos]
    A --> C[Gestión de Usuarios]
    A --> D[Configuración de Descuentos]
    A --> E[Analíticas]
    
    B --> B1[Listar Grupos]
    B --> B2[Ver Detalles]
    B --> B3[Exportar/Importar]
    B --> B4[Sincronizar Miembros]
    
    C --> C1[Listar Usuarios]
    C --> C2[Editar Permisos]
    C --> C3[Configurar max_members_per_group]
    C --> C4[Configurar discount_tier_identifier]
    C --> C5[Exportar/Importar]
    
    D --> D1[Habilitar/Deshabilitar Programa]
    D --> D2[Configurar Tiers por Miembros]
    D --> D3[Configurar Tiers por Identificador]
    D --> D4[Configurar max_members_default]
    D --> D5[Configurar invite_redirect_url]
    
    E --> E1[Total Grupos]
    E --> E2[Total Miembros]
    E --> E3[Grupos por Estado]
    E --> E4[Top Grupos]
```

### Customer Account Extension

```mermaid
graph TD
    A[Customer Account Extension] --> B{¿Tiene grupos?}
    B -->|No| C{¿Puede crear grupos?}
    B -->|Sí| D[Listar Grupos]
    
    C -->|Sí| E[Formulario Crear Grupo]
    C -->|No| F[Formulario Unirse por Código]
    
    D --> G[Ver Detalles del Grupo]
    G --> H[Ver Miembros]
    G --> I[Invitar a alguien]
    G --> J[Ver Código de Invitación]
    
    I --> K[Formulario Email]
    K --> L{¿Email enviado?}
    L -->|Sí| M[✅ Éxito]
    L -->|No| N[⚠️ Código para compartir]
    
    E --> O{¿Ya tiene grupo?}
    O -->|Sí| P[Error: Solo un grupo]
    O -->|No| Q[Crear con max_members_per_group]
```

### Storefront (Público)

```mermaid
graph LR
    A[Storefront App Block] --> B[Login/Registro]
    B --> C[Customer Portal]
    C --> D[Crear Grupo]
    C --> E[Unirse por Código]
    C --> F[Gestionar Grupo]
    
    E --> G[Ingresar Código]
    G --> H{¿Código válido?}
    H -->|Sí| I[Unirse al Grupo]
    H -->|No| J[Error]
```

## 🗄️ Estructura de Base de Datos

```mermaid
erDiagram
    USERS ||--o{ FF_GROUPS : "owner_user_id"
    USERS ||--o{ FF_GROUP_MEMBERS : "user_id"
    FF_GROUPS ||--o{ FF_GROUP_MEMBERS : "group_id"
    FF_GROUPS ||--o{ FF_INVITATIONS : "group_id"
    FF_DISCOUNT_CONFIG ||--o{ FF_GROUPS : "merchant_id"
    
    USERS {
        uuid id PK
        string email
        string password_hash
        string name
        boolean can_create_groups
        integer max_members_per_group
        string discount_tier_identifier
        string shopify_customer_id
        boolean is_active
    }
    
    FF_GROUPS {
        uuid id PK
        string merchant_id
        string name
        string owner_customer_id
        string owner_email
        uuid owner_user_id FK
        string invite_code
        integer max_members
        integer current_members
        integer discount_tier
        string status
    }
    
    FF_GROUP_MEMBERS {
        uuid id PK
        uuid group_id FK
        string email
        uuid user_id FK
        boolean is_owner
        string status
    }
    
    FF_INVITATIONS {
        uuid id PK
        uuid group_id FK
        string email
        string token
        timestamp expires_at
    }
    
    FF_DISCOUNT_CONFIG {
        string merchant_id PK
        boolean is_enabled
        json tiers
        integer max_members_default
        string invite_redirect_url
    }
```

## 🔐 Sistema de Permisos

```mermaid
flowchart TD
    A[Usuario] --> B{¿can_create_groups?}
    B -->|Sí| C[Puede crear grupos]
    B -->|No| D[Solo puede unirse]
    
    C --> E{¿max_members_per_group?}
    E -->|Configurado| F[Usa valor del usuario]
    E -->|No configurado| G[Usa config.max_members_default]
    
    C --> H{¿discount_tier_identifier?}
    H -->|Configurado| I[Usa tier del usuario]
    H -->|No configurado| J[Usa tier por defecto: 1]
    
    D --> K[Debe usar código de invitación]
    K --> L[O recibir invitación por email]
```

## 📧 Sistema de Emails

```mermaid
flowchart TD
    A[Crear Invitación] --> B{¿RESEND_API_KEY?}
    B -->|No| C[Error: No configurado]
    B -->|Sí| D{¿RESEND_FROM_EMAIL?}
    
    D -->|No| E[Usar onboarding@resend.dev]
    D -->|Sí| F{¿Dominio verificado?}
    
    E --> G{¿Email de prueba?}
    G -->|Sí| H[✅ Email enviado]
    G -->|No| I[❌ Error 403]
    
    F -->|Sí| H
    F -->|No| I
    
    I --> J[Mostrar código de invitación]
    J --> K[Usuario comparte manualmente]
```

## 🎨 Componentes UI

### Admin Dashboard Components

```
AdminDashboard
├── QuickAccessCards
│   ├── GroupsCard
│   ├── UsersCard
│   ├── ConfigCard
│   └── AnalyticsCard
├── GroupsManagementPage
│   ├── GroupsList
│   ├── GroupDetails
│   ├── ExportButton
│   └── ImportModal
├── UsersManagementPage
│   ├── UsersList
│   ├── UserCard
│   │   ├── PermissionsToggle
│   │   └── GroupSettings
│   ├── ExportButton
│   └── ImportModal
├── DiscountConfigPage
│   ├── EnableToggle
│   ├── TiersList
│   │   ├── TierByMemberCount
│   │   └── TierByIdentifier
│   └── SaveButton
└── AnalyticsPage
    ├── StatsCards
    ├── GroupsByStatus
    └── TopGroups
```

### Customer Account Extension Components

```
ProfileBlock
├── GroupsList
│   └── GroupCard
│       ├── GroupInfo
│       └── ViewDetailsButton
├── GroupDetailsView
│   ├── GroupInfo
│   ├── MembersList
│   ├── InviteButton
│   └── InviteForm
│       ├── EmailInput
│       ├── SendButton
│       └── ErrorBanner
└── CreateGroupForm
    ├── NameInput
    └── CreateButton
```

## 🔄 Estados y Validaciones

### Validaciones de Grupo

```mermaid
flowchart TD
    A[Crear Grupo] --> B{¿Usuario autenticado?}
    B -->|No| C[Error 401]
    B -->|Sí| D{¿can_create_groups?}
    D -->|No| E[Error 403]
    D -->|Sí| F{¿Ya tiene grupo?}
    F -->|Sí| G[Error: Solo un grupo]
    F -->|No| H[Crear grupo]
    H --> I{¿max_members_per_group?}
    I -->|Sí| J[Usar valor del usuario]
    I -->|No| K[Usar config.default]
    J --> L[Grupo creado]
    K --> L
```

### Validaciones de Invitación

```mermaid
flowchart TD
    A[Crear Invitación] --> B{¿Grupo existe?}
    B -->|No| C[Error 404]
    B -->|Sí| D{¿Grupo lleno?}
    D -->|Sí| E[Error: Grupo lleno]
    D -->|No| F{¿Email ya en grupo?}
    F -->|Sí| G[Error: Ya es miembro]
    F -->|No| H[Crear invitación]
    H --> I[Enviar email]
    I --> J{¿Email enviado?}
    J -->|Sí| K[✅ Éxito]
    J -->|No| L[⚠️ Invitación creada, mostrar código]
```

## 🌐 Integraciones

### Shopify Integration

```mermaid
graph LR
    A[Shopify Admin] --> B[Embedded App]
    C[Customer Account] --> D[UI Extension]
    E[Storefront] --> F[App Block]
    
    B --> G[Next.js App]
    D --> G
    F --> G
    
    G --> H[Shopify Session Tokens]
    G --> I[Shopify Customer ID]
```

### Email Integration (Resend)

```mermaid
graph LR
    A[API Route] --> B[Email Service]
    B --> C{¿API Key?}
    C -->|No| D[Skip Email]
    C -->|Sí| E[Resend API]
    E --> F{¿Dominio verificado?}
    F -->|Sí| G[✅ Email enviado]
    F -->|No| H[❌ Error 403]
    H --> I[Mostrar código manual]
```

## 📱 Flujos de Usuario Completos

### Usuario Nuevo (Sin Permisos)

```
1. Registro/Login
2. Ver mensaje: "No puedes crear grupos"
3. Recibir invitación por email
4. Click en link con código
5. Unirse al grupo automáticamente
6. Ver grupo en su perfil
```

### Usuario con Permisos

```
1. Registro/Login
2. Ver opción "Crear Grupo"
3. Crear grupo (max_members automático)
4. Ver detalles del grupo
5. Invitar miembros por email
6. Si email falla, compartir código manualmente
7. Gestionar miembros del grupo
```

### Administrador

```
1. Login en Shopify Admin
2. Acceder a Friends & Family App
3. Ver Dashboard con métricas
4. Gestionar usuarios y permisos
5. Configurar descuentos y tiers
6. Ver analíticas
7. Exportar/Importar datos
```

## 🎯 Características Clave

### 1. Sistema de Descuentos Flexible

- **Tiers por Número de Miembros**: Descuentos basados en el tamaño del grupo
- **Tiers por Identificador**: Descuentos basados en `discount_tier_identifier` del usuario
- **Prioridad**: Si el grupo tiene `discount_tier`, busca por identificador primero, luego por número de miembros

### 2. Control de Permisos Granular

- `can_create_groups`: Controla si el usuario puede crear grupos
- `max_members_per_group`: Límite personalizado por usuario
- `discount_tier_identifier`: Tier de descuento asignado al usuario

### 3. Gestión de Invitaciones

- Invitaciones por email (si el dominio está verificado)
- Códigos de invitación para compartir manualmente
- Links pre-rellenados con código
- Validación de límites y duplicados

### 4. Sincronización de Datos

- Sincronización automática de `current_members`
- Botón manual de sincronización en admin
- Exportación/Importación de grupos y usuarios

## 🔒 Seguridad

- JWT tokens para autenticación web
- Shopify Session Tokens para Customer Account Extensions
- Validación de permisos en cada endpoint
- Protección de rutas con middleware
- Validación de límites de grupos y miembros

## 📊 Métricas y Analíticas

- Total de grupos
- Total de miembros
- Tamaño promedio de grupos
- Grupos por estado (activo, inactivo, suspendido, terminado)
- Top grupos por cantidad de miembros

---

**Última actualización**: 2025-11-06  
**Versión**: 1.0.0

