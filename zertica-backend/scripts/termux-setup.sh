#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Zertica · Instalación del backend dentro del celular (Termux)
#
# Instala Node.js, MariaDB (compatible con MySQL) y Git, descarga el proyecto,
# crea la base de datos "zertica" con los datos de prueba y deja el comando
# "zertica" para arrancar todo.
#
# Uso (en Termux):
#   curl -fsSLo setup.sh https://raw.githubusercontent.com/interaxias-cyber/ZERTICA-APP/main/zertica-backend/scripts/termux-setup.sh && bash setup.sh
#
# Se puede ejecutar de nuevo sin problema (por ejemplo, para actualizar).
# =============================================================================
set -e

REPO_URL="https://github.com/interaxias-cyber/ZERTICA-APP.git"
APP_DIR="$HOME/ZERTICA-APP"
BACKEND="$APP_DIR/zertica-backend"
DB_PASS="Zertica2026"

paso() { printf '\n\033[1;33m▶ %s\033[0m\n' "$1"; }
ok() { printf '\033[1;32m✔ %s\033[0m\n' "$1"; }

if [ -z "$PREFIX" ] || [ ! -d "/data/data/com.termux" ]; then
  echo "Este script es para Termux en Android."
  exit 1
fi

paso "1/6 Actualizando paquetes de Termux (puede tardar unos minutos)"
yes | pkg update -y || true
yes | pkg upgrade -y || true

paso "2/6 Instalando Node.js, MariaDB, Git y herramientas de compilación"
pkg install -y nodejs-lts git mariadb python make clang binutils
ok "Node $(node -v) · $(mariadb --version | cut -d' ' -f1-6)"

# node-gyp en Android necesita esta variable para compilar bcrypt.
mkdir -p "$HOME/.gyp"
if [ ! -f "$HOME/.gyp/include.gypi" ]; then
  echo "{'variables':{'android_ndk_path':''}}" > "$HOME/.gyp/include.gypi"
fi

paso "3/6 Descargando el proyecto"
if [ -d "$APP_DIR/.git" ]; then
  git -C "$APP_DIR" pull --ff-only || echo "(No se pudo actualizar; se usa la copia existente)"
else
  git clone --depth 1 "$REPO_URL" "$APP_DIR"
fi
ok "Proyecto en $APP_DIR"

paso "4/6 Iniciando MariaDB"
DATADIR="$PREFIX/var/lib/mysql"
if [ ! -d "$DATADIR/mysql" ]; then
  mariadb-install-db --datadir="$DATADIR" > /dev/null
fi
if ! mariadb-admin ping --silent > /dev/null 2>/dev/null; then
  (mariadbd-safe --datadir="$DATADIR" > /dev/null 2>&1 &)
  for i in $(seq 1 30); do
    mariadb-admin ping --silent > /dev/null 2>/dev/null && break
    sleep 1
  done
fi
mariadb-admin ping --silent > /dev/null || { echo "MariaDB no arrancó."; exit 1; }

# mariadb-install-db crea como administradores (autenticación por socket) al
# usuario de Termux y a root. Se busca cuál puede crear usuarios.
ADMIN_USER=""
for u in "$(whoami)" root "$USER"; do
  [ -z "$u" ] && continue
  if mariadb -u "$u" -N -e "SELECT 1 FROM mysql.user LIMIT 1" > /dev/null 2>&1; then
    ADMIN_USER="$u"
    break
  fi
done
if [ -z "$ADMIN_USER" ]; then
  echo "✖ No se encontró un usuario administrador de MariaDB."
  echo "  Envía una captura de: mariadb -u \"$(whoami)\" -e 'SELECT CURRENT_USER()'"
  exit 1
fi
mariadb -u "$ADMIN_USER" -e "
  CREATE USER IF NOT EXISTS 'zertica'@'localhost' IDENTIFIED BY '$DB_PASS';
  CREATE USER IF NOT EXISTS 'zertica'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
  ALTER USER 'zertica'@'localhost' IDENTIFIED BY '$DB_PASS';
  ALTER USER 'zertica'@'127.0.0.1' IDENTIFIED BY '$DB_PASS';
  GRANT ALL PRIVILEGES ON *.* TO 'zertica'@'localhost';
  GRANT ALL PRIVILEGES ON *.* TO 'zertica'@'127.0.0.1';
  FLUSH PRIVILEGES;"
DB_SOCKET="$(mariadb -u "$ADMIN_USER" -N -e 'SELECT @@socket' 2>/dev/null)"
ok "MariaDB lista (usuario zertica, socket $DB_SOCKET)"

paso "5/6 Instalando dependencias del backend (bcrypt se compila: 2–5 minutos)"
cd "$BACKEND"
npm install --omit=dev --no-audit --no-fund

if [ ! -f .env ]; then
  cat > .env <<EOF
NODE_ENV=development
PORT=3000
HOST=0.0.0.0
CORS_ORIGIN=*
PUBLIC_BASE_URL=
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=zertica
DB_PASSWORD=$DB_PASS
DB_NAME=zertica
DB_ADMIN_USER=
DB_ADMIN_PASSWORD=
DB_SOCKET=$DB_SOCKET
JWT_SECRET=zertica_termux_$(head -c 24 /dev/urandom | od -An -tx1 | tr -d ' \n')
JWT_EXPIRES_IN=8h
RESET_TOKEN_EXPIRES_IN=30m
BCRYPT_ROUNDS=10
UPLOADS_DIR=uploads
UPLOAD_MAX_MB=5
EOF
  ok "Archivo .env creado"
fi

paso "6/6 Creando la base de datos con los datos de prueba"
if mariadb -u zertica -p"$DB_PASS" -e "USE zertica; SELECT 1 FROM users LIMIT 1;" > /dev/null 2>&1; then
  ok "La base ya existe: se conservan tus datos (para reiniciarla: zertica-reset)"
else
  npm run db:init
fi

# Comandos rápidos.
RC="$HOME/.bashrc"
touch "$RC"
grep -q "alias zertica=" "$RC" || echo "alias zertica='bash $BACKEND/scripts/termux-start.sh'" >> "$RC"
grep -q "alias zertica-reset=" "$RC" || echo "alias zertica-reset='cd $BACKEND && npm run db:init; cd ~'" >> "$RC"

cat <<'EOF'

==========================================================
 ✔ Instalación terminada

 Para usar Zertica:
   1. Cierra y vuelve a abrir Termux (o ejecuta: source ~/.bashrc)
   2. Escribe:  zertica
   3. En la app: ⚙️ Servidor → 127.0.0.1 → Probar conexión → Guardar

 Deja Termux abierto en segundo plano mientras usas la app.
==========================================================
EOF
