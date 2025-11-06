# 📧 Guía Completa: Configurar Resend para Producción

## 🎯 Objetivo

Habilitar el envío de emails de invitación a cualquier destinatario, no solo a tu email de prueba.

---

## 📋 Paso a Paso

### Paso 1: Acceder a Resend

1. Ve a [resend.com](https://resend.com)
2. Inicia sesión con tu cuenta (o créala si no tienes una)
3. Una vez dentro, ve a **"Domains"** en el menú lateral izquierdo

---

### Paso 2: Agregar un Dominio

1. Haz clic en el botón **"Add Domain"** (o **"Add"**)
2. Ingresa tu dominio. Tienes dos opciones:

   **Opción A: Dominio Principal**
   - Ejemplo: `infracommerce.lat`
   - Ventaja: Más profesional
   - Requiere: Acceso a DNS del dominio principal

   **Opción B: Subdominio (Recomendado)**
   - Ejemplo: `mail.infracommerce.lat` o `noreply.infracommerce.lat`
   - Ventaja: Más fácil de configurar, no afecta el dominio principal
   - Requiere: Acceso a DNS para crear subdominio

3. Haz clic en **"Add"** o **"Continue"**

---

### Paso 3: Configurar Registros DNS

Resend te mostrará una lista de registros DNS que debes agregar. Normalmente incluyen:

#### Registros TXT (Verificación)

```
Type: TXT
Name: @ (o el subdominio, ej: mail)
Value: resend-verification=abc123xyz...
```

#### Registros SPF (Opcional pero recomendado)

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### Registros DKIM (Opcional pero recomendado)

```
Type: CNAME
Name: resend._domainkey
Value: resend._domainkey.resend.com
```

#### Registros DMARC (Opcional pero recomendado)

```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none;
```

---

### Paso 4: Agregar Registros en tu Proveedor de DNS

**¿Dónde agregar los registros?**

Depende de dónde compraste tu dominio:

- **Cloudflare**: DNS → Records → Add record
- **GoDaddy**: DNS Management → Add
- **Namecheap**: Advanced DNS → Add New Record
- **Google Domains**: DNS → Custom records
- **Otros**: Busca "DNS Management" o "DNS Records"

**Pasos generales**:
1. Accede al panel de tu proveedor de dominio
2. Busca la sección de DNS o DNS Management
3. Agrega cada registro que Resend te proporcionó
4. Guarda los cambios

**Nota**: Los cambios DNS pueden tardar desde minutos hasta 24 horas en propagarse.

---

### Paso 5: Verificar el Dominio en Resend

1. Vuelve a Resend → Domains
2. Verás el estado de tu dominio:
   - 🟡 **Pending**: Esperando verificación
   - 🟢 **Verified**: Dominio verificado (¡listo!)
   - 🔴 **Failed**: Error en la verificación

3. Resend verificará automáticamente los registros DNS
4. Puedes hacer clic en **"Verify"** o **"Refresh"** para verificar manualmente
5. Una vez verificado, verás un check verde ✅

**Tiempo de verificación**: 
- Normalmente: 5-30 minutos
- Máximo: 24 horas (si hay problemas de propagación DNS)

---

### Paso 6: Configurar Variable de Entorno en Vercel

Una vez que el dominio esté verificado:

1. Ve a tu proyecto en Vercel: [vercel.com](https://vercel.com)
2. Selecciona el proyecto `shopify-friends-family-app`
3. Ve a **Settings** → **Environment Variables**
4. Agrega o edita la variable:

   ```
   RESEND_FROM_EMAIL=noreply@tudominio.com
   ```

   **Ejemplos**:
   - Si usaste el dominio principal: `noreply@infracommerce.lat`
   - Si usaste subdominio: `noreply@mail.infracommerce.lat`
   - O cualquier email válido: `invitaciones@infracommerce.lat`

5. Asegúrate de seleccionar **"Production"**, **"Preview"**, y **"Development"**
6. Haz clic en **"Save"**

---

### Paso 7: Redeploy la Aplicación

Después de agregar la variable de entorno:

```bash
cd /Users/julianmartel/appointment/shopify-friends-family-app
vercel --prod --yes
```

O espera a que Vercel detecte los cambios y despliegue automáticamente.

---

### Paso 8: Probar el Envío de Emails

1. Ve a tu aplicación en Shopify
2. Crea o accede a un grupo
3. Intenta invitar a alguien con un email diferente al tuyo
4. Verifica que:
   - ✅ El email se envía exitosamente
   - ✅ El destinatario recibe el email
   - ✅ El link de invitación funciona

---

## 🔍 Troubleshooting

### El dominio no se verifica

**Problema**: Resend muestra "Pending" o "Failed"

**Soluciones**:
1. Verifica que agregaste los registros DNS correctamente
2. Espera más tiempo (hasta 24 horas)
3. Usa herramientas como [MXToolbox](https://mxtoolbox.com) para verificar que los registros DNS están propagados
4. Verifica que el nombre del registro coincide exactamente (case-sensitive)
5. Asegúrate de que no hay registros DNS conflictivos

### El email no se envía después de verificar

**Problema**: Dominio verificado pero emails fallan

**Soluciones**:
1. Verifica que `RESEND_FROM_EMAIL` está configurado correctamente en Vercel
2. Asegúrate de que el email usa el dominio verificado (ej: `noreply@tudominio.com`)
3. Verifica que `RESEND_API_KEY` está configurada
4. Revisa los logs de Vercel para ver errores específicos
5. Prueba con el endpoint `/api/debug/test-email`

### Error "Domain not verified"

**Problema**: Aún ves el error de dominio no verificado

**Soluciones**:
1. Verifica que el dominio está completamente verificado en Resend (check verde)
2. Asegúrate de que `RESEND_FROM_EMAIL` usa exactamente el dominio verificado
3. Espera unos minutos después de verificar (puede haber un delay)
4. Redeploy la aplicación después de configurar `RESEND_FROM_EMAIL`

---

## ✅ Checklist de Verificación

Antes de considerar que está listo:

- [ ] Dominio agregado en Resend
- [ ] Registros DNS agregados en proveedor de dominio
- [ ] Dominio verificado en Resend (check verde ✅)
- [ ] Variable `RESEND_FROM_EMAIL` configurada en Vercel
- [ ] Aplicación redeployada
- [ ] Email de prueba enviado exitosamente
- [ ] Email recibido por destinatario
- [ ] Link de invitación funciona correctamente

---

## 📞 Recursos Adicionales

- [Resend Domains Documentation](https://resend.com/docs/dashboard/domains/introduction)
- [Resend DNS Records Guide](https://resend.com/docs/dashboard/domains/dns-records)
- [Resend API Documentation](https://resend.com/docs/api-reference/emails/send-email)

---

## 🎯 Siguiente Paso

Una vez configurado, podrás:
- ✅ Enviar invitaciones a cualquier email
- ✅ Los usuarios recibirán emails profesionales desde tu dominio
- ✅ Mejor deliverability (menos spam)
- ✅ Branding consistente en emails

---

**¿Necesitas ayuda con algún paso específico?** 🚀

