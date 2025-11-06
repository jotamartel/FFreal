# 🔧 Troubleshooting SMTP - Guía de Diagnóstico

## 🎯 Endpoints de Diagnóstico

He creado endpoints específicos para diagnosticar problemas de SMTP:

### 1. Verificar Configuración SMTP

```bash
GET https://shopify-friends-family-app.vercel.app/api/debug/smtp-test
```

**Respuesta esperada:**
```json
{
  "config": {
    "hasSMTP": true,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587",
    "smtpSecure": "false",
    "smtpUser": "jul***",
    "hasPassword": true,
    "passwordLength": 16
  },
  "connectionTest": {
    "success": true,
    "message": "SMTP connection successful"
  }
}
```

### 2. Probar Envío de Email

```bash
POST https://shopify-friends-family-app.vercel.app/api/debug/smtp-test
Content-Type: application/json

{
  "to": "tuemail@gmail.com"
}
```

---

## 🔍 Problemas Comunes y Soluciones

### Problema 1: "SMTP not configured"

**Síntoma**: El endpoint devuelve `hasSMTP: false`

**Solución**:
1. Verifica en Vercel → Settings → Environment Variables que tengas:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
2. Asegúrate de que las variables estén guardadas
3. Espera 1-2 minutos después de agregar variables
4. Haz un redeploy si es necesario

---

### Problema 2: "EAUTH" - Authentication Failed

**Síntoma**: Error `EAUTH` o "SMTP authentication failed"

**Causas posibles**:
1. **App Password incorrecta**: No estás usando la App Password de Google
2. **Verificación en 2 pasos no habilitada**: Debe estar habilitada para usar App Passwords
3. **Password con espacios**: La App Password no debe tener espacios

**Solución**:
1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Genera una nueva App Password
3. Copia los 16 caracteres **sin espacios**
4. Actualiza `SMTP_PASSWORD` en Vercel
5. Espera el redeploy

**Formato correcto**:
```
❌ Incorrecto: "abcd efgh ijkl mnop"
✅ Correcto: "abcdefghijklmnop"
```

---

### Problema 3: "ECONNECTION" - Connection Failed

**Síntoma**: Error `ECONNECTION` o "SMTP connection failed"

**Causas posibles**:
1. **Host incorrecto**: `SMTP_HOST` no es correcto
2. **Puerto incorrecto**: `SMTP_PORT` no coincide con `SMTP_SECURE`
3. **Firewall/Red**: Vercel no puede conectarse al servidor SMTP

**Solución**:

**Para Gmail:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Para Outlook:**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Verifica**:
- `SMTP_HOST` no debe tener `https://` o `http://`
- `SMTP_PORT` debe ser string: `"587"` no `587`
- `SMTP_SECURE` debe ser string: `"false"` no `false`

---

### Problema 4: "ETIMEDOUT" - Connection Timeout

**Síntoma**: Error `ETIMEDOUT`

**Causas posibles**:
1. **Red lenta**: Vercel no puede conectarse en tiempo razonable
2. **Puerto bloqueado**: El puerto SMTP está bloqueado
3. **Configuración incorrecta**: `SMTP_SECURE` no coincide con el puerto

**Solución**:
1. Verifica que `SMTP_PORT=587` y `SMTP_SECURE=false` (para TLS)
2. O prueba con `SMTP_PORT=465` y `SMTP_SECURE=true` (para SSL)
3. Verifica que no haya firewalls bloqueando

---

### Problema 5: Variables no se cargan en Vercel

**Síntoma**: Las variables están en Vercel pero el código dice que no están configuradas

**Solución**:
1. Verifica que las variables estén en el **entorno correcto** (Production, Preview, Development)
2. Asegúrate de que estén **guardadas** (no solo escritas)
3. Haz un **redeploy** después de agregar variables
4. Espera 1-2 minutos para que se propaguen

---

## 🧪 Pasos de Diagnóstico

### Paso 1: Verificar Variables

```bash
GET /api/debug/smtp-test
```

Revisa:
- ✅ `hasSMTP: true`
- ✅ `smtpHost` tiene valor
- ✅ `smtpPort` tiene valor
- ✅ `hasPassword: true`
- ✅ `passwordLength: 16` (para Gmail App Password)

### Paso 2: Probar Conexión

El endpoint `/api/debug/smtp-test` (GET) prueba la conexión automáticamente.

Si `connectionTest.success: false`, revisa el error:
- `EAUTH` → Problema de autenticación
- `ECONNECTION` → Problema de conexión
- `ETIMEDOUT` → Timeout

### Paso 3: Probar Envío

```bash
POST /api/debug/smtp-test
{
  "to": "tuemail@gmail.com"
}
```

Si falla, revisa los logs de Vercel para ver el error específico.

---

## 📋 Checklist de Configuración

- [ ] `SMTP_HOST` configurado (ej: `smtp.gmail.com`)
- [ ] `SMTP_PORT` configurado (ej: `587`)
- [ ] `SMTP_SECURE` configurado (ej: `false`)
- [ ] `SMTP_USER` configurado (tu email completo)
- [ ] `SMTP_PASSWORD` configurado (App Password de 16 caracteres, sin espacios)
- [ ] `SMTP_FROM_EMAIL` configurado (opcional, usa `SMTP_USER` si no está)
- [ ] Variables guardadas en Vercel
- [ ] Variables en el entorno correcto (Production)
- [ ] Aplicación redeployada después de agregar variables
- [ ] Verificación en 2 pasos habilitada en Gmail
- [ ] App Password generada correctamente

---

## 🔍 Verificar en Logs de Vercel

1. Ve a Vercel → Tu proyecto → **Deployments** → Último deployment
2. Click en **Functions** o **Logs**
3. Busca logs con `[EMAIL]` o `[SMTP TEST]`
4. Revisa los errores específicos

**Logs útiles**:
- `[EMAIL] SMTP transporter initialized` → ✅ Configuración correcta
- `[EMAIL] ✅ SMTP connection verified` → ✅ Conexión exitosa
- `[EMAIL] ❌ SMTP connection verification failed` → ❌ Problema de conexión
- `[EMAIL] ❌ SMTP error: EAUTH` → ❌ Problema de autenticación

---

## 🚀 Prueba Rápida

1. **Verifica configuración**:
   ```
   GET https://shopify-friends-family-app.vercel.app/api/debug/smtp-test
   ```

2. **Prueba conexión** (automático en GET)

3. **Envía email de prueba**:
   ```
   POST https://shopify-friends-family-app.vercel.app/api/debug/smtp-test
   {
     "to": "tuemail@gmail.com"
   }
   ```

4. **Revisa logs** en Vercel si falla

---

## ⚠️ Notas Importantes

1. **App Password vs Contraseña Normal**:
   - ❌ NO uses tu contraseña normal de Gmail
   - ✅ USA la App Password de 16 caracteres

2. **Espacios en App Password**:
   - Gmail muestra: `abcd efgh ijkl mnop`
   - Debes usar: `abcdefghijklmnop` (sin espacios)

3. **Variables como Strings**:
   - En Vercel, todas las variables son strings
   - `SMTP_PORT` debe ser `"587"` (con comillas en el valor)
   - `SMTP_SECURE` debe ser `"false"` (con comillas)

4. **Redeploy Necesario**:
   - Después de agregar variables, haz redeploy
   - O espera el deploy automático (puede tardar 1-2 minutos)

---

## 🆘 Si Nada Funciona

1. **Prueba con otro email**: Usa un email diferente para descartar problemas del destinatario
2. **Verifica Gmail**: Asegúrate de que "Less secure app access" no esté bloqueado (aunque App Passwords debería funcionar)
3. **Prueba Outlook**: Si Gmail no funciona, prueba con Outlook
4. **Revisa logs detallados**: Los logs de Vercel tienen información específica del error

---

**¿Qué error específico estás viendo?** Comparte los logs o el mensaje de error para ayudarte mejor. 🔍

