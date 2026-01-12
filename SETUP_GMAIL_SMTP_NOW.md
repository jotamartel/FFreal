# 📧 Configurar Gmail SMTP - Guía Paso a Paso

## 🎯 Objetivo

Configurar Gmail SMTP para enviar emails de invitaciones inmediatamente, sin necesidad de verificar un dominio.

---

## ✅ Paso 1: Habilitar Verificación en 2 Pasos en Gmail

1. **Ve a tu cuenta de Google**
   - https://myaccount.google.com/security
   - O ve a Gmail → Tu foto → **"Gestionar tu cuenta de Google"** → **"Seguridad"**

2. **Habilita Verificación en 2 pasos**
   - Busca **"Verificación en 2 pasos"**
   - Click en **"Activar"** o **"Empezar"**
   - Sigue los pasos para configurarlo (puede requerir tu teléfono)

3. **Confirma que está activado**
   - Deberías ver **"Verificación en 2 pasos: Activada"**

⚠️ **IMPORTANTE**: La verificación en 2 pasos DEBE estar activada para generar App Passwords.

---

## ✅ Paso 2: Generar App Password

1. **Ve a App Passwords**
   - En la misma página de Seguridad de Google
   - Busca **"Contraseñas de aplicaciones"** o **"App Passwords"**
   - O ve directamente: https://myaccount.google.com/apppasswords

2. **Si no ves la opción**
   - Asegúrate de que la verificación en 2 pasos esté activada
   - Puede tardar unos minutos en aparecer después de activarla

3. **Generar nueva App Password**
   - Selecciona **"Seleccionar app"** → **"Correo"**
   - Selecciona **"Seleccionar dispositivo"** → **"Otro (nombre personalizado)"**
   - Escribe: `Shopify Friends Family App`
   - Click **"Generar"**

4. **Copiar la contraseña**
   - Google te mostrará una contraseña de **16 caracteres** (sin espacios)
   - Ejemplo: `abcd efgh ijkl mnop` → Copia como: `abcdefghijklmnop`
   - ⚠️ **GUARDA ESTA CONTRASEÑA** - solo se muestra una vez
   - Si la pierdes, tendrás que generar una nueva

---

## ✅ Paso 3: Configurar Variables en Vercel

1. **Ve a tu proyecto en Vercel**
   - https://vercel.com
   - Selecciona tu proyecto: `shopify-friends-family-app`

2. **Ve a Settings → Environment Variables**
   - Click en **"Settings"** en el menú superior
   - Click en **"Environment Variables"** en el menú lateral

3. **Agregar Variables SMTP**

   Agrega estas **5 variables** una por una:

   **Variable 1: SMTP_HOST**
   - **Key**: `SMTP_HOST`
   - **Value**: `smtp.gmail.com`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 2: SMTP_PORT**
   - **Key**: `SMTP_PORT`
   - **Value**: `587`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 3: SMTP_SECURE**
   - **Key**: `SMTP_SECURE`
   - **Value**: `false`
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 4: SMTP_USER**
   - **Key**: `SMTP_USER`
   - **Value**: Tu email de Gmail (ej: `tuemail@gmail.com`)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 5: SMTP_PASSWORD**
   - **Key**: `SMTP_PASSWORD`
   - **Value**: La App Password de 16 caracteres que generaste (sin espacios)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

   **Variable 6: SMTP_FROM_EMAIL** (Opcional pero recomendado)
   - **Key**: `SMTP_FROM_EMAIL`
   - **Value**: El mismo email que SMTP_USER (ej: `tuemail@gmail.com`)
   - **Environments**: ✅ Production, ✅ Preview, ✅ Development

4. **Guardar cada variable**
   - Click **"Save"** después de agregar cada una

---

## ✅ Paso 4: Redeploy en Vercel

Después de agregar todas las variables:

1. **Opción A: Redeploy automático**
   - Vercel redeployará automáticamente en el próximo push
   - O espera unos minutos y Vercel detectará los cambios

2. **Opción B: Redeploy manual**
   - Ve a **"Deployments"**
   - Click en el último deployment
   - Click en **"..."** (tres puntos) → **"Redeploy"**
   - Selecciona **"Use existing Build Cache"** (opcional)
   - Click **"Redeploy"**

---

## ✅ Paso 5: Probar el Envío

### Opción A: Desde la App

1. Ve a tu aplicación desplegada
2. Crea o accede a un grupo
3. Intenta invitar a alguien
4. Verifica que el email se envíe correctamente

### Opción B: Endpoint de Prueba

Si tienes acceso al endpoint de prueba:

```bash
POST https://tu-app.vercel.app/api/debug/test-email
Content-Type: application/json

{
  "to": "tu-email-de-prueba@gmail.com",
  "subject": "Test Email",
  "html": "<p>Este es un email de prueba</p>"
}
```

O desde la interfaz si existe.

---

## ✅ Checklist Final

- [ ] Verificación en 2 pasos habilitada en Gmail
- [ ] App Password generada y copiada (16 caracteres)
- [ ] `SMTP_HOST` configurado en Vercel (`smtp.gmail.com`)
- [ ] `SMTP_PORT` configurado en Vercel (`587`)
- [ ] `SMTP_SECURE` configurado en Vercel (`false`)
- [ ] `SMTP_USER` configurado en Vercel (tu email de Gmail)
- [ ] `SMTP_PASSWORD` configurado en Vercel (App Password de 16 caracteres)
- [ ] `SMTP_FROM_EMAIL` configurado en Vercel (opcional, mismo que SMTP_USER)
- [ ] Todas las variables marcadas para Production, Preview y Development
- [ ] Redeploy realizado en Vercel
- [ ] Email de prueba enviado exitosamente

---

## 🐛 Troubleshooting

### Error: "Invalid login" o "Authentication failed"

**Causa**: App Password incorrecta o no generada

**Solución**:
1. Verifica que copiaste la App Password completa (16 caracteres)
2. Asegúrate de que NO tenga espacios
3. Verifica que la verificación en 2 pasos esté activada
4. Genera una nueva App Password si es necesario

### Error: "Connection timeout"

**Causa**: Puerto o host incorrecto

**Solución**:
- Verifica `SMTP_HOST=smtp.gmail.com` (sin espacios)
- Verifica `SMTP_PORT=587` (no 465, que es para SSL)
- Verifica `SMTP_SECURE=false` (no true)

### Error: "SMTP not configured"

**Causa**: Variables no configuradas o no se aplicaron

**Solución**:
1. Verifica que todas las variables estén en Vercel
2. Verifica que estén marcadas para el ambiente correcto (Production/Preview/Development)
3. Haz un redeploy después de agregar las variables
4. Espera unos minutos para que se propaguen

### Error: "Less secure app access"

**Causa**: Estás usando tu contraseña normal en lugar de App Password

**Solución**:
- NO uses tu contraseña normal de Gmail
- DEBES usar una App Password generada específicamente
- La App Password tiene 16 caracteres y se genera desde Google Account → App Passwords

---

## 📋 Resumen de Variables

Aquí está el resumen de todas las variables que necesitas:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tuemail@gmail.com
SMTP_PASSWORD=abcdefghijklmnop
SMTP_FROM_EMAIL=tuemail@gmail.com
```

**Reemplaza:**
- `tuemail@gmail.com` → Tu email de Gmail real
- `abcdefghijklmnop` → Tu App Password de 16 caracteres (sin espacios)

---

## 💡 Notas Importantes

1. **App Password vs Contraseña Normal**
   - ❌ NO uses tu contraseña normal de Gmail
   - ✅ DEBES usar una App Password generada
   - La App Password es específica para aplicaciones externas

2. **Seguridad**
   - La App Password es segura - solo funciona para SMTP
   - Puedes revocarla en cualquier momento desde Google Account
   - Si la comprometes, genera una nueva

3. **Límites de Gmail**
   - Gmail tiene límites de envío (500 emails/día en cuenta gratuita)
   - Para producción con muchos emails, considera Resend con dominio verificado

4. **Prioridad del Sistema**
   - El sistema intenta SMTP primero
   - Si SMTP falla, intenta Resend como fallback
   - Esto te da redundancia automática

---

## 🎉 ¡Listo!

Una vez configurado, las invitaciones se enviarán automáticamente usando Gmail SMTP. El sistema detectará automáticamente la configuración SMTP y la usará en lugar de Resend.

---

## 📚 Archivos Relacionados

- `lib/email/service.ts` - Código del servicio de email
- `GMAIL_SMTP_SETUP.md` - Guía alternativa más detallada
- `FIX_RESEND_TEST_MODE.md` - Información sobre las opciones disponibles
