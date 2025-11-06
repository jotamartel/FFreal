# 📧 Configuración de Gmail SMTP - Guía Rápida

## 🎯 Objetivo

Configurar Gmail SMTP para enviar emails de invitación sin necesidad de verificar un dominio.

---

## ✅ Ventajas

- ✅ No requiere acceso a DNS
- ✅ Configuración rápida (15 minutos)
- ✅ Usa tu email personal de Gmail
- ✅ Funciona inmediatamente

## ⚠️ Limitaciones

- ⚠️ Límite de 500 emails/día (Gmail)
- ⚠️ Puede ir a spam (menos deliverability que dominio verificado)
- ⚠️ Requiere "App Password" de Google

---

## 📋 Paso a Paso

### Paso 1: Habilitar Verificación en 2 Pasos

1. Ve a [myaccount.google.com](https://myaccount.google.com)
2. Ve a **Seguridad** → **Verificación en 2 pasos**
3. Sigue los pasos para habilitarla (si no la tienes)

### Paso 2: Generar App Password

1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Si no aparece directamente, ve a:
   - **Seguridad** → **Verificación en 2 pasos** → **Contraseñas de aplicaciones**
3. Selecciona:
   - **Aplicación**: "Correo"
   - **Dispositivo**: "Otro (nombre personalizado)" → Escribe "Friends & Family App"
4. Haz clic en **Generar**
5. **Copia la contraseña de 16 caracteres** (se muestra solo una vez)
   - Formato: `xxxx xxxx xxxx xxxx` (sin espacios: `xxxxxxxxxxxxxxxx`)

### Paso 3: Configurar Variables en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables** y agrega:

```env
# SMTP Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuemail@gmail.com
SMTP_PASSWORD=xxxxxxxxxxxxxxxx
SMTP_FROM_EMAIL=tuemail@gmail.com
```

**Ejemplo**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=julian.martel@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
SMTP_FROM_EMAIL=julian.martel@gmail.com
```

**Importante**: 
- `SMTP_USER`: Tu email de Gmail completo
- `SMTP_PASSWORD`: La App Password de 16 caracteres (sin espacios)
- `SMTP_FROM_EMAIL`: Puede ser el mismo que `SMTP_USER` o un alias

### Paso 4: Desactivar Resend (Opcional)

Si quieres usar solo SMTP y no Resend, puedes:

1. **Opción A**: No hacer nada - El sistema intentará SMTP primero, luego Resend
2. **Opción B**: Remover `RESEND_API_KEY` de Vercel para usar solo SMTP

### Paso 5: Redeploy

Después de agregar las variables:

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod --yes
```

O espera el despliegue automático.

---

## 🧪 Probar el Envío

1. Ve a tu aplicación
2. Crea o accede a un grupo
3. Intenta invitar a alguien
4. Verifica que el email se envía correctamente

**Endpoint de prueba**: `/api/debug/test-email`

---

## 🔧 Configuración para Outlook

Si prefieres usar Outlook en lugar de Gmail:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuemail@outlook.com
SMTP_PASSWORD=tu_contraseña_o_app_password
SMTP_FROM_EMAIL=tuemail@outlook.com
```

**Nota**: Outlook también requiere App Password si tienes 2FA habilitado.

---

## 🎯 Prioridad de Servicios

El sistema intenta enviar emails en este orden:

1. **SMTP** (si está configurado) → Gmail/Outlook
2. **Resend** (si SMTP falla o no está configurado)

Esto te da flexibilidad para:
- Usar SMTP para desarrollo/pruebas
- Cambiar a Resend cuando tengas dominio verificado
- Tener fallback automático

---

## ✅ Checklist

- [ ] Verificación en 2 pasos habilitada en Gmail
- [ ] App Password generada y copiada
- [ ] Variables SMTP configuradas en Vercel
- [ ] Aplicación redeployada
- [ ] Email de prueba enviado exitosamente

---

## 🆘 Troubleshooting

### Error: "Invalid login"

**Causa**: App Password incorrecta o no generada

**Solución**:
1. Verifica que copiaste la App Password completa (16 caracteres)
2. Asegúrate de no tener espacios
3. Genera una nueva App Password si es necesario

### Error: "Connection timeout"

**Causa**: Puerto o host incorrecto

**Solución**:
- Verifica `SMTP_HOST=smtp.gmail.com`
- Verifica `SMTP_PORT=587`
- Verifica `SMTP_SECURE=false`

### Error: "Authentication failed"

**Causa**: Verificación en 2 pasos no habilitada

**Solución**:
1. Habilita verificación en 2 pasos en Gmail
2. Genera una nueva App Password
3. Usa la App Password, no tu contraseña normal

---

## 📊 Límites

### Gmail
- **Límite diario**: 500 emails/día
- **Límite por minuto**: ~20 emails/minuto
- **Límite por usuario**: 2,000 emails/día (con cuenta de Google Workspace)

### Outlook
- **Límite diario**: 300 emails/día
- **Límite por minuto**: ~30 emails/minuto

---

## 🚀 Siguiente Paso

Una vez configurado:
1. ✅ Prueba enviar una invitación
2. ✅ Verifica que el email llega correctamente
3. ✅ Considera migrar a Resend con dominio verificado para producción

---

**¿Listo para configurar?** 🎯

