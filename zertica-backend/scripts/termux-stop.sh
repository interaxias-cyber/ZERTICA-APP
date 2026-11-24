#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Zertica · Apaga todo en el celular (Termux): backend, MariaDB y wake-lock.
# Uso: zertica-stop
# =============================================================================
printf '▶ Apagando Zertica...\n'

# 1. Backend (node src/server.js)
if pkill -f "node src/server.js" 2>/dev/null; then
  printf '\033[1;32m✔ Backend detenido\033[0m\n'
else
  echo "  (El backend no estaba encendido)"
fi

# 2. MariaDB
if mariadb-admin ping --silent > /dev/null 2>&1; then
  mariadb-admin -u zertica -pZertica2026 shutdown 2>/dev/null \
    || mariadb-admin -u "$(whoami)" shutdown 2>/dev/null \
    || pkill -f mariadbd 2>/dev/null
  for i in $(seq 1 15); do
    mariadb-admin ping --silent > /dev/null 2>&1 || break
    sleep 1
  done
  printf '\033[1;32m✔ MariaDB detenida\033[0m\n'
else
  echo "  (MariaDB no estaba encendida)"
fi

# 3. Permite que Android vuelva a suspender Termux.
command -v termux-wake-unlock > /dev/null && termux-wake-unlock
printf '\033[1;32m✔ Listo: ya no consume batería. Puedes cerrar Termux con: exit\033[0m\n'
