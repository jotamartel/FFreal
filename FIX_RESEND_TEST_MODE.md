# 🔧 Solución: Resend en Modo de Prueba

## ⚠️ Problema

Resend está usando el dominio de prueba (`onboarding@resend.dev`), que solo permite enviar emails a direcciones verificadas en tu cuenta de Resend.

**Mensaje de error:**
```
El servicio de email está en modo de prueba. Para enviar invitaciones a otros usuarios, necesitas verificar un dominio en Resend.
```

---

## ✅ Soluciones Disponibles

Tienes **3 opciones** para resolver esto:

### Opción 1: Verificar un Dominio en Resend (Recomendado para Producción)

**Ventajas:**
- ✅ Puedes enviar a cualquier email
- ✅ Mejor deliverability
- ✅ Profesional (emails desde tu dominio)
- ✅ Gratis en plan básico de Resend

**Pasos:**

1. **Ve a Resend Dashboard**
   - https://resend.com/domains
   - Inicia sesión con tu cuenta

2. **Agregar Dominio**
   - Click **"Add Domain"**
   - Ingresa tu dominio (ej: `infracommerce.lat`)
   - O usa un subdominio (ej: `mail.infracommerce.lat`)

3. **Configurar Registros DNS**
   - Resend te dará registros DNS (TXT, SPF, DKIM)
   - Agrégalos en tu proveedor de dominio (donde compraste el dominio)
   - Ejemplo de registros:
     ```
     Type: TXT
     Name: @
     Value: resend-verification=abc123...
     ```

4. **Esperar Verificación**
   - Resend verificará automáticamente (minutos a 24 horas)
   - Recibirás un email cuando esté verificado

5. **Configurar Variable de Entorno**
   - En Vercel → Settings → Environment Variables
   - Agrega:
     ```env
     RESEND_FROM_EMAIL=noreply@tudominio.com
     ```
   - O si usas subdominio:
     ```env
     RESEND_FROM_EMAIL=noreply@mail.tudominio.com
     ```

6. **Redeploy**
   - Vercel redeployará automáticamente
   - O ejecuta: `vercel --prod`

**📚 Guía Completa:** Ver `RESEND_DOMAIN_SETUP.md`

---

### Opción 2: Usar SMTP (Gmail/Outlook) - Alternativa Rápida

**Ventajas:**
- ✅ Funciona inmediatamente (sin verificar dominio)
- ✅ Puedes usar tu Gmail/Outlook existente
- ✅ No necesitas configurar DNS

**Pasos:**

1. **Configurar Gmail (Recomendado)**
   - Habilita verificación en 2 pasos en Gmail
   - Genera una App Password:
     - Google Account → Security → 2-Step Verification → App Passwords
     - Genera una nueva App Password para "Mail"
     - Copia la contraseña de 16 caracteres

2. **Configurar Variables en Vercel**
   - Ve a Vercel → Settings → Environment Variables
   - Agrega:
     ```env
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=tuemail@gmail.com
     SMTP_PASSWORD=tu_app_password_de_16_caracteres
     SMTP_FROM_EMAIL=tuemail@gmail.com
     ```

3. **Redeploy**
   - Vercel redeployará automáticamente

**📚 Guía Completa:** Ver `GMAIL_SMTP_SETUP.md`

**Nota:** El sistema intentará SMTP primero, luego Resend como fallback.

---

### Opción 3: Agregar Emails de Prueba en Resend (Solución Temporal)

**Ventajas:**
- ✅ Rápido (sin configuración DNS)
- ✅ Útil para desarrollo/pruebas

**Limitaciones:**
- ⚠️ Solo puedes enviar a emails agregados en Resend
- ⚠️ No es ideal para producción

**Pasos:**

1. **Ve a Resend Dashboard**
   - https://resend.com/emails
   - Ve a **Settings** → **Test Emails**

2. **Agregar Emails de Prueba**
   - Click **"Add Test Email"**
   - Agrega los emails a los que quieres enviar invitaciones
   - Ejemplo: `usuario1@example.com`, `usuario2@example.com`

3. **Verificar Emails**
   - Resend enviará un email de verificación
   - Haz click en el link para verificar

4. **Listo**
   - Ahora puedes enviar a esos emails usando `onboarding@resend.dev`
   - No necesitas cambiar ninguna configuración

**Nota:** Esta es solo para desarrollo. Para producción, usa Opción 1 o 2.

---

## 🔄 Solución Temporal Mientras Configuras

Mientras configuras una de las opciones anteriores, puedes:

1. **Compartir el código de invitación manualmente**
   - La invitación se crea exitosamente
   - Solo el email no se envía
   - Puedes copiar el código y compartirlo con el usuario

2. **Ver el código de invitación en la interfaz**
   - El código aparece en la respuesta de la API
   - O en la interfaz de administración de grupos

---

## 🎯 Recomendación

**Para Desarrollo/Pruebas:**
- Usa **Opción 3** (emails de prueba) o **Opción 2** (SMTP con Gmail)

**Para Producción:**
- Usa **Opción 1** (verificar dominio en Resend) para mejor profesionalismo
- O **Opción 2** (SMTP) si prefieres usar tu email existente

---

## ✅ Checklist Según Opción Elegida

### Si eliges Verificar Dominio (Opción 1):
- [ ] Dominio agregado en Resend
- [ ] Registros DNS configurados en tu proveedor de dominio
- [ ] Dominio verificado en Resend (email de confirmación)
- [ ] `RESEND_FROM_EMAIL` configurado en Vercel
- [ ] Redeploy realizado
- [ ] Invitación de prueba enviada exitosamente

### Si eliges SMTP (Opción 2):
- [ ] Verificación en 2 pasos habilitada en Gmail
- [ ] App Password generada
- [ ] Variables SMTP configuradas en Vercel
- [ ] Redeploy realizado
- [ ] Invitación de prueba enviada exitosamente

### Si eliges Emails de Prueba (Opción 3):
- [ ] Emails agregados en Resend → Settings → Test Emails
- [ ] Emails verificados (click en link de verificación)
- [ ] Invitación de prueba enviada exitosamente

---

## 🐛 Troubleshooting

### Error: "Domain not verified"
- Verifica que los registros DNS estén correctos
- Espera hasta 24 horas para propagación DNS
- Verifica en Resend Dashboard que el dominio muestre "Verified"

### Error: "SMTP authentication failed"
- Verifica que la App Password sea correcta (16 caracteres, sin espacios)
- Asegúrate de usar App Password, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté habilitada

### Error: "Test email not verified"
- Verifica que hayas hecho click en el link de verificación de Resend
- Revisa tu carpeta de spam
- Agrega el email nuevamente si es necesario

---

## 📚 Archivos Relacionados

- `RESEND_DOMAIN_SETUP.md` - Guía detallada para verificar dominio
- `GMAIL_SMTP_SETUP.md` - Guía detallada para configurar SMTP
- `lib/email/service.ts` - Código del servicio de email

---

## 💡 Nota Importante

El sistema intenta enviar emails en este orden:
1. **SMTP** (si está configurado)
2. **Resend** (si SMTP no está configurado o falla)

Esto te da flexibilidad para cambiar entre servicios sin modificar código.

---

## 🎉 ¡Listo!

Elige la opción que mejor se adapte a tus necesidades y sigue los pasos. Una vez configurado, las invitaciones se enviarán correctamente.
