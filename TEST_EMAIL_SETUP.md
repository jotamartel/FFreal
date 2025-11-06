# 🧪 Probar Configuración de Email

## ✅ Configuración Completada

Ya configuraste las variables SMTP en Vercel. Ahora vamos a verificar que todo funciona.

---

## 🔍 Paso 1: Verificar Configuración

Después de que Vercel despliegue los cambios, visita:

```
https://shopify-friends-family-app.vercel.app/api/debug/test-email
```

Deberías ver algo como:

```json
{
  "config": {
    "hasResend": true/false,
    "hasSMTP": true,
    "smtpHost": "smtp.gmail.com",
    "smtpPort": "587",
    "smtpUser": "jul***",
    "fromEmail": "tuemail@gmail.com",
    "servicePriority": "SMTP → Resend"
  },
  "message": "SMTP configured (will be used first). Use POST to test email sending."
}
```

---

## 📧 Paso 2: Enviar Email de Prueba

### Opción A: Usando cURL

```bash
curl -X POST https://shopify-friends-family-app.vercel.app/api/debug/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "tuemail@gmail.com"}'
```

### Opción B: Usando el navegador (con extensión)

1. Instala una extensión como "REST Client" o "Postman"
2. Haz una petición POST a:
   ```
   https://shopify-friends-family-app.vercel.app/api/debug/test-email
   ```
3. Body (JSON):
   ```json
   {
     "to": "tuemail@gmail.com"
   }
   ```

### Opción C: Desde la aplicación

1. Ve a tu aplicación en Shopify
2. Crea un grupo
3. Intenta invitar a alguien
4. Verifica que el email se envía

---

## ✅ Respuesta Esperada

Si todo está bien configurado, deberías recibir:

```json
{
  "success": true,
  "message": "message-id-from-smtp",
  "config": {
    "hasSMTP": true,
    "serviceUsed": "SMTP",
    "fromEmail": "tuemail@gmail.com"
  }
}
```

Y deberías recibir un email en tu bandeja de entrada (o spam) con el asunto:
**"Test Email - Friends & Family"**

---

## 🐛 Troubleshooting

### Error: "SMTP not configured"

**Causa**: Las variables no están en Vercel o el deploy aún no se completó.

**Solución**:
1. Verifica en Vercel → Settings → Environment Variables que todas las variables estén:
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `SMTP_FROM_EMAIL` (opcional)
2. Espera 1-2 minutos después de agregar las variables
3. Verifica que el deploy se completó en Vercel

### Error: "Invalid login" o "Authentication failed"

**Causa**: App Password incorrecta o no generada correctamente.

**Solución**:
1. Ve a [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Genera una nueva App Password
3. Asegúrate de copiar los 16 caracteres sin espacios
4. Actualiza `SMTP_PASSWORD` en Vercel
5. Espera el redeploy

### Error: "Connection timeout"

**Causa**: Puerto o host incorrecto.

**Solución**:
- Verifica `SMTP_HOST=smtp.gmail.com`
- Verifica `SMTP_PORT=587`
- Verifica `SMTP_SECURE=false`

### No recibo el email

**Posibles causas**:
1. **En spam**: Revisa la carpeta de spam
2. **Límite de Gmail**: Gmail tiene límite de 500 emails/día
3. **App Password incorrecta**: Verifica que la App Password sea correcta
4. **Verificación en 2 pasos no habilitada**: Debe estar habilitada para usar App Passwords

---

## 🎯 Próximos Pasos

Una vez que el email de prueba funcione:

1. ✅ **Probar invitación real**: Crea un grupo e invita a alguien
2. ✅ **Verificar deliverability**: Revisa que los emails lleguen a la bandeja principal (no spam)
3. ✅ **Monitorear logs**: Revisa los logs de Vercel si hay problemas

---

## 📊 Monitoreo

Puedes ver los logs de email en Vercel:

1. Ve a Vercel → Tu proyecto → **Deployments** → Último deployment → **Functions**
2. Busca logs con `[EMAIL]` para ver el estado de los envíos

---

**¿Todo funcionando?** 🎉

Si el email de prueba funciona, ya puedes usar la aplicación normalmente. Las invitaciones se enviarán automáticamente usando Gmail SMTP.

