# 📧 Configuración de Dominio en Resend

## ⚠️ Problema Actual

El servicio de email está usando el dominio de prueba de Resend (`onboarding@resend.dev`), que solo permite enviar emails a tu propia dirección de email (`julian.martel@infracommerce.lat`).

Para enviar invitaciones a otros usuarios, necesitas verificar un dominio en Resend.

## ✅ Solución: Verificar un Dominio en Resend

### Paso 1: Acceder a Resend

1. Ve a [resend.com](https://resend.com)
2. Inicia sesión con tu cuenta
3. Ve a **Domains** en el menú lateral

### Paso 2: Agregar y Verificar un Dominio

1. Haz clic en **"Add Domain"**
2. Ingresa tu dominio (ej: `infracommerce.lat` o un subdominio como `mail.infracommerce.lat`)
3. Resend te proporcionará registros DNS que debes agregar a tu proveedor de dominio

### Paso 3: Configurar Registros DNS

Resend te dará registros DNS como estos:

```
Type: TXT
Name: @
Value: resend-verification=abc123...
```

Agrega estos registros en tu proveedor de dominio (donde compraste el dominio).

### Paso 4: Esperar Verificación

- Resend verificará automáticamente los registros DNS
- Esto puede tomar desde minutos hasta 24 horas
- Recibirás un email cuando el dominio esté verificado

### Paso 5: Configurar Variable de Entorno

Una vez verificado, agrega esta variable de entorno en Vercel:

```env
RESEND_FROM_EMAIL=noreply@tudominio.com
```

O si usas un subdominio:

```env
RESEND_FROM_EMAIL=noreply@mail.tudominio.com
```

**Importante**: El email debe usar el dominio que verificaste en Resend.

### Paso 6: Redeploy

Después de agregar la variable de entorno, redeploya la aplicación en Vercel:

```bash
vercel --prod
```

## 🔄 Solución Temporal

Mientras verificas el dominio, puedes:

1. **Compartir el código de invitación manualmente**: El sistema crea la invitación exitosamente, solo que no puede enviar el email. Puedes copiar el código de invitación y compartirlo con el usuario.

2. **Usar tu email de prueba**: Si necesitas probar el flujo completo, envía invitaciones a `julian.martel@infracommerce.lat` (tu email de prueba).

## 📝 Notas

- El dominio debe estar completamente verificado antes de poder enviar emails
- Puedes verificar múltiples dominios en Resend
- Los emails enviados desde dominios verificados tienen mejor deliverability
- Resend tiene un plan gratuito que incluye verificación de dominio

## 🔗 Recursos

- [Resend Domains Documentation](https://resend.com/docs/dashboard/domains/introduction)
- [Resend DNS Records Guide](https://resend.com/docs/dashboard/domains/dns-records)

