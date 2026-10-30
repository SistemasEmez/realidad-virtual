ÓRBITA AR STUDIO — BASE SQL

Motor: SQLite en desarrollo local; Cloudflare D1 en el alojamiento Sites.
El archivo schema.sql contiene el esquema completo para una base vacía.
Las migraciones incrementales y sus metadatos se mantienen en ../drizzle/.
No importes schema.sql sobre una base existente: aplica solamente las migraciones pendientes.

Tablas:
- panel_users: usuario, nombre, hash de contraseña, rol admin/member, estado y versión de credenciales.
- panel_sessions: hash del token de sesión, usuario, versión y vencimiento.
- panel_setup: cierre permanente de la creación del primer administrador.
- experiences: experiencias y configuración, vinculadas a su propietario.
- experience_links: enlaces compartidos y credenciales de visitantes.
- viewer_sessions: sesiones de visitantes por experiencia.
- viewer_attempts: límites de intentos de autenticación.

INICIO
1. Abre el panel local y verifica la cuenta propietaria con ChatGPT si se solicita.
2. En Crear administrador, define tu usuario (por defecto admin) y tu contraseña.
3. Las experiencias y archivos existentes conservan el mismo identificador de propietario.
4. El administrador puede crear, modificar y desactivar usuarios desde Usuarios.
5. Cada persona puede cambiar su contraseña desde Mi contraseña o su avatar.

No se distribuye una contraseña administrativa por defecto.
Se guardan hashes PBKDF2 con sal por contraseña y hashes SHA-256 de los tokens.
Las cookies son HttpOnly y SameSite=Lax; en HTTPS también son Secure.
Al desactivar una cuenta o cambiar sus credenciales se invalidan sus sesiones anteriores.

La base de pruebas es independiente. Nunca ejecutes los fixtures de pruebas sobre la base real.

PRUEBAS DEL ACCESO
Después de compilar, inicia node scripts/auth-test-server.mjs en una terminal.
En otra, ejecuta node scripts/verify-panel-auth.mjs.
El servidor de pruebas usa SQL/R2 efímeros en 127.0.0.1:5178 y no abre la base del panel.
Detén ese servidor al terminar. La cuenta admin de prueba no es la cuenta del panel real.

TARGETS EN EL PANEL
En Generar target puedes seleccionar hasta cinco imágenes y compilar un archivo .mind.
Usar en esta experiencia guarda el archivo y cambia el target del borrador actual.
Guarda la experiencia para conservar el cambio. Los índices de las imágenes empiezan en 0.
