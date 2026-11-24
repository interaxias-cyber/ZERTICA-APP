#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Zertica · Arranca MariaDB y el backend dentro del celular (Termux).
# Uso: zertica   (alias creado por termux-setup.sh)
# Para detener el backend: Ctrl+C
# =============================================================================
BACKEND="$(cd "$(dirname "$0")/.." && pwd)"
DATADIR="$PREFIX/var/lib/mysql"

# Evita que Android suspenda Termux mientras el backend está encendido.
command -v termux-wake-lock > /dev/null && termux-wake-lock

if ! mariadb-admin ping --silent > /dev/null 2>/dev/null; then
  printf '▶ Iniciando MariaDB...\n'
  (mariadbd-safe --datadir="$DATADIR" > /dev/null 2>&1 &)
  for i in $(seq 1 30); do
    mariadb-admin ping --silent > /dev/null 2>/dev/null && break
    sleep 1
  done
fi
mariadb-admin ping --silent > /dev/null 2>/dev/null || { echo "✖ MariaDB no arrancó. Prueba: mariadbd-safe &"; exit 1; }
printf '\033[1;32m✔ MariaDB en marcha\033[0m\n'

# Si el backend ya está encendido (otra sesión de Termux), no se arranca de nuevo.
if node -e "require('http').get('http://127.0.0.1:3000/api/health',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))" 2>/dev/null; then
  printf '\033[1;32m✔ El backend ya está encendido en http://127.0.0.1:3000/api\033[0m\n'
  echo "  (Corre en otra sesión de Termux. Para reiniciarlo, deténlo allí con Ctrl+C y vuelve a escribir: zertica)"
  exit 0
fi

cat <<'EOF'

  En la app Zertica: ⚙️ Servidor → 127.0.0.1 → Guardar
  Usuarios: juan / Usuario2026#  ·  admin / Admin2026#  ·  constructora / Empresa2026#
  Deja Termux abierto en segundo plano. Para detener: Ctrl+C

EOF

cd "$BACKEND" && exec npm start
