# 🔧 Fix: Error de Autenticación SMTP

## ❌ Problema

Los logs muestran:
```
[EMAIL] ❌ SMTP connection verification failed: {
  error: 'Invalid login: 535-5.7.8 Username and Password not accepted'
  code: 'EAUTH'
}
```

**Causa**: La App Password de Gmail no es válida o fue revocada.

---

## ✅ Solución: Generar Nueva App Password

### Paso 1: Ir a App Passwords de Google

1. Ve a: **https://myaccount.google.com/apppasswords**
2. O ve a: Google Account → Seguridad → Verificación en 2 pasos → Contraseñas de aplicaciones

### Paso 2: Eliminar App Password Antigua (Opcional pero Recomendado)

1. Si ves una App Password llamada "Shopify Friends Family App" o similar
2. Click en el ícono de eliminar (🗑️) para revocarla
3. Esto asegura que no haya conflictos

### Paso 3: Generar Nueva App Password

1. Selecciona:
   - **Aplicación**: "Correo"
   - **Dispositivo**: "Otro (nombre personalizado)"
   - **Nombre**: `Shopify Friends Family App V2` (o cualquier nombre)
2. Click **"Generar"**
3. **Copia la contraseña de 16 caracteres** (se muestra solo una vez)
   - Formato: `xxxx xxxx xxxx xxxx`
   - **Copia SIN espacios**: `xxxxxxxxxxxxxxxx`

### Paso 4: Actualizar Variable en Vercel

1. Ve a **Vercel** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca `SMTP_PASSWORD`
3. Click en los **3 puntos** (⋯) → **Edit**
4. **Reemplaza** el valor con la nueva App Password (16 caracteres, sin espacios)
5. Click **Save**

### Paso 5: Redeploy

Después de actualizar la variable:

1. Ve a **Deployments**
2. Click en el último deployment
3. Click **"..."** → **"Redeploy"**
4. O espera el redeploy automático

---

## 🔍 Verificar que Funciona

Después del redeploy, intenta crear una invitación nuevamente. Los logs deberían mostrar:

```
[EMAIL] ✅ SMTP connection verified
[EMAIL] ✅ Email sent via SMTP
```

En lugar de:
```
[EMAIL] ❌ SMTP connection verification failed
```

---

## 🐛 Troubleshooting

### Error persiste después de generar nueva App Password

**Posibles causas:**

1. **Verificación en 2 pasos no está habilitada**
   - Ve a: https://myaccount.google.com/security
   - Verifica que "Verificación en 2 pasos" esté **Activada**
   - Si no está activada, habilítala primero

2. **App Password copiada incorrectamente**
   - Asegúrate de copiar los 16 caracteres **sin espacios**
   - Ejemplo correcto: `abcdefghijklmnop`
   - Ejemplo incorrecto: `abcd efgh ijkl mnop` (con espacios)

3. **Email incorrecto en SMTP_USER**
   - Verifica que `SMTP_USER` sea exactamente tu email de Gmail
   - Ejemplo: `julian.martel@infracommerce.lat`
   - No debe tener espacios al inicio o final

4. **Variable no se actualizó en Vercel**
   - Verifica que guardaste la variable correctamente
   - Verifica que está marcada para **Production**
   - Haz un redeploy después de actualizar

### Error: "Less secure app access"

**Causa**: Estás usando tu contraseña normal en lugar de App Password

**Solución**: 
- ❌ NO uses tu contraseña normal de Gmail
- ✅ DEBES usar una App Password generada específicamente
- La App Password tiene 16 caracteres y se genera desde Google Account

---

## 📋 Checklist

- [ ] Verificación en 2 pasos habilitada en Gmail
- [ ] Nueva App Password generada (16 caracteres)
- [ ] App Password copiada SIN espacios
- [ ] `SMTP_PASSWORD` actualizada en Vercel
- [ ] Variable marcada para Production
- [ ] Redeploy realizado
- [ ] Invitación de prueba enviada exitosamente

---

## 💡 Notas Importantes

1. **App Password es específica**
   - Cada App Password es única
   - Si la revocas, necesitas generar una nueva
   - Puedes tener múltiples App Passwords activas

2. **Seguridad**
   - La App Password solo funciona para SMTP
   - Puedes revocarla en cualquier momento
   - Si la comprometes, genera una nueva

3. **Formato**
   - La App Password siempre tiene 16 caracteres
   - Google la muestra con espacios, pero debes copiarla sin espacios
   - Ejemplo: `abcd efgh ijkl mnop` → Copia como: `abcdefghijklmnop`

---

## 🎉 ¡Listo!

Una vez que actualices la App Password y hagas redeploy, SMTP debería funcionar correctamente y los emails se enviarán sin problemas.
