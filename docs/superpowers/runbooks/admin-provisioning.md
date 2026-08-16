# Provisioning Del Panel Daring

## Variables

Configurar como secretos de Cloudflare y como variables locales en `.dev.vars`:

- `ADMIN_EMAIL`: correo del administrador.
- `ADMIN_PASSWORD_HASH`: hash generado con el script local.
- `ADMIN_SESSION_SECRET`: secreto aleatorio usado como reserva para futuras sesiones firmadas.
- `MERCADOPAGO_ACCESS_TOKEN`: token de prueba o producción, según el entorno.
- `RESEND_API_KEY`: clave del proveedor de correo cuando se conecte el envío.

Nunca reemplazar los valores de `.dev.vars.example` con credenciales reales.

## Generar Hash

Desde la raíz del proyecto:

```bash
node --experimental-strip-types scripts/create-admin-hash.mjs --password="una-contraseña-local"
```

Copiar el resultado únicamente al secreto `ADMIN_PASSWORD_HASH` o a un archivo `.dev.vars` local que no se versiona.

## Crear Usuario D1

Generar un identificador aleatorio y ejecutar una inserción local o remota con el hash generado:

```sql
INSERT INTO admin_users (id, email, password_hash)
VALUES ('ID_ALEATORIO', 'admin@example.com', 'HASH_GENERADO');
```

No guardar el hash real en documentación, commits ni capturas de pantalla.

## Verificación Local

1. Ejecutar las migraciones D1 locales.
2. Iniciar Pages Dev con Wrangler.
3. Abrir `/admin/login/`.
4. Ingresar las credenciales provisionadas.
5. Confirmar que `/api/auth/session` devuelve `authenticated: true`.
6. Confirmar que `/api/admin/health` devuelve `ok: true`.
7. Cerrar sesión y confirmar que las rutas protegidas devuelven HTTP 401.

## Verificación De Seguridad

```bash
git grep -n -I -E 'sbp_[A-Za-z0-9]+|EAAB[A-Za-z0-9]+|access_token=[A-Za-z0-9]|api[_-]?key=[A-Za-z0-9]' --cached
```

El comando no debe devolver credenciales reales.
