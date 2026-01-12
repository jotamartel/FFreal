# Plan de Pruebas Friends & Family (L'Oréal)

## 1. Autenticación & Middleware
- [ ] Acceder a `/login` sin sesión y verificar que carga correctamente.
- [ ] Iniciar sesión y asegurar que `/customer` y `/tienda` son accesibles.
- [ ] Intentar acceder a `/customer` sin sesión y validar redirección a `/login`.
- [ ] Confirmar que `/closed` y `/tienda/unirse` se cargan sin sesión.
- [ ] Enviar una petición `OPTIONS` a `/api/invitations` y comprobar encabezados CORS.

## 2. Storefront & Portales
- [ ] Crear grupo desde Shopify Customer Account Extension (usuario con permiso).
- [ ] Unirse con código desde `/tienda/unirse` y desde la extensión cuando la tienda está abierta.
- [ ] Marcar tienda como cerrada en admin y verificar redirección a `/closed`.
- [ ] Revisar que `/tienda` muestra el banner del grupo activo y métricas correctas.

## 3. Invitaciones y Correos
- [ ] Generar invitación desde admin y confirmar email/HTML (SMTP/Resend).
- [ ] Aceptar invitación y verificar envío de email de bienvenida.
- [ ] Probar verificación de email (enlace válido y expirado).
- [ ] Revisar logs cuando el dominio de Resend no está verificado (mensaje amigable).

## 4. Órdenes & OMS
- [ ] Simular webhook `order-created` con payload realista y validar POST al OMS.
- [ ] Simular webhook `refund` y confirmar reenvío al OMS.
- [ ] Revisar manejo de errores (OMS sin configurar) y que se loguee correctamente.

## 5. Panel Admin
- [ ] Configuración: actualizar email remitente, mensaje y términos, comprobar persistencia.
- [ ] Analíticas: cargar métricas, growth y distribución (con datos reales/seeding).
- [ ] Grupos: filtrar por estado y rango de miembros, ejecutar acciones (suspender/reactivar/sync).
- [ ] Exportar/Importar (JSON/CSV) y revisar mensajes de feedback.

## 6. Emails Transaccionales
- [ ] Confirmación de pedido, despachado, entregado, incidente y reembolso parcial con plantillas correctas.
- [ ] Validar que se usen remitentes configurados por merchant.
- [ ] Verificar versiones en español/inglés.

## 7. Documentación
- [ ] Actualizar README/SETUP con variables `OMS_API_URL`, `OMS_API_KEY`, `EMAIL_FROM`, etc.
- [ ] Registrar pasos para activar dominios en Resend o SMTP alternativo.
