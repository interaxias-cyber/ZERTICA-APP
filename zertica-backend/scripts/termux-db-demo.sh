#!/data/data/com.termux/files/usr/bin/bash
# =============================================================================
# Zertica · Recorrido por la base de datos (para mostrar en clase)
# Uso:  zertica-db-demo            (recorrido completo, pausa entre secciones)
#       zertica-db-demo pedidos    (solo una sección: tablas, estructura,
#                                   catalogo, usuarios, pedidos, facturas,
#                                   empresa, integridad)
# Consola SQL libre: zertica-db
# =============================================================================
DB="mariadb -u zertica -pZertica2026 zertica --table --default-character-set=utf8mb4"
SECTION="${1:-todo}"

titulo() { printf '\n\033[1;33m══ %s ══\033[0m\n' "$1"; }
nota() { printf '\033[0;36m%s\033[0m\n' "$1"; }
sql() { printf '\033[0;90mSQL> %s\033[0m\n' "$1"; $DB -e "$1"; }
pausa() { [ "$SECTION" = "todo" ] && { printf '\n\033[0;90m(Enter para continuar)\033[0m'; read -r _; }; }
mostrar() { [ "$SECTION" = "todo" ] || [ "$SECTION" = "$1" ]; }

if ! mariadb-admin ping --silent > /dev/null 2>&1; then
  echo "MariaDB no está encendida. Ejecuta primero: zertica"
  exit 1
fi

if mostrar tablas; then
  titulo "1. Tablas de la base 'zertica' (14)"
  nota "5 tablas del MVP + 9 de la ampliación v2."
  nota "Conteo exacto con COUNT(*): se actualiza en cuanto se agrega un registro."
  sql "SELECT 'addresses' AS tabla, COUNT(*) AS filas FROM addresses UNION ALL SELECT 'brands' AS tabla, COUNT(*) AS filas FROM brands UNION ALL SELECT 'cart_items' AS tabla, COUNT(*) AS filas FROM cart_items UNION ALL SELECT 'categories' AS tabla, COUNT(*) AS filas FROM categories UNION ALL SELECT 'companies' AS tabla, COUNT(*) AS filas FROM companies UNION ALL SELECT 'account_contacts' AS tabla, COUNT(*) AS filas FROM account_contacts UNION ALL SELECT 'invoices' AS tabla, COUNT(*) AS filas FROM invoices UNION ALL SELECT 'order_items' AS tabla, COUNT(*) AS filas FROM order_items UNION ALL SELECT 'orders' AS tabla, COUNT(*) AS filas FROM orders UNION ALL SELECT 'payment_methods' AS tabla, COUNT(*) AS filas FROM payment_methods UNION ALL SELECT 'product_features' AS tabla, COUNT(*) AS filas FROM product_features UNION ALL SELECT 'products' AS tabla, COUNT(*) AS filas FROM products UNION ALL SELECT 'support_messages' AS tabla, COUNT(*) AS filas FROM support_messages UNION ALL SELECT 'users' AS tabla, COUNT(*) AS filas FROM users;"
  pausa
fi

if mostrar estructura; then
  titulo "2. Estructura de 'products' (claves, tipos, restricciones)"
  sql "DESCRIBE products;"
  titulo "Claves foráneas (relaciones entre tablas)"
  sql "SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna, REFERENCED_TABLE_NAME AS referencia, REFERENCED_COLUMN_NAME AS columna_ref FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA='zertica' AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME;"
  pausa
fi

if mostrar catalogo; then
  titulo "3. Catálogo: productos con su categoría y marca (JOIN)"
  sql "SELECT p.reference AS referencia, p.name AS producto, c.name AS categoria, b.name AS marca, p.price AS precio, p.stock, IF(p.is_active,'Sí','No') AS activo FROM products p JOIN categories c ON c.id=p.category_id JOIN brands b ON b.id=p.brand_id ORDER BY p.name;"
  titulo "Características (product_features)"
  sql "SELECT p.reference AS referencia, f.name AS caracteristica, f.value AS valor FROM product_features f JOIN products p ON p.id=f.product_id;"
  pausa
fi

if mostrar usuarios; then
  titulo "4. Usuarios: administradores, clientes y empresas"
  nota "La base NO guarda contraseñas, solo su hash bcrypt (irreversible)."
  nota "Las contraseñas de prueba se reconocen comparando el hash; las nuevas aparecen como cifradas."
  sql "SELECT u.id, CASE u.role WHEN 'admin' THEN 'Administrador' WHEN 'company' THEN 'Empresa' ELSE 'Cliente' END AS tipo, u.username AS usuario, u.full_name AS nombre, u.email AS correo, CASE u.password_hash WHEN '\$2b\$10\$oBIu//ZDdG0L3Hk1jT1Zs.IUM.9VXEoC5K9obGmm54G8DSj4YR1vy' THEN 'Admin2026#' WHEN '\$2b\$10\$7R5fPGxxGbLlI5M3zACnwecazJRox71Pb2f86piThjHIG86A6x0r.' THEN 'Usuario2026#' WHEN '\$2b\$10\$9rTOuZnAJZLf8VGY5Ayh7.Qx9hrFEPRYjsjmsgPrSkrm94IDnDIUy' THEN 'Inactivo2026#' WHEN '\$2b\$10\$PyP6L2hutMidEyKgnYpMr.OiWTnoaMlUTS.ZbHWOcVcyi1nhlhMgS' THEN 'Empresa2026#' ELSE '(cifrada: la eligió el usuario)' END AS contrasena, IFNULL(c.name,'-') AS empresa, IF(u.is_active,'Activo','Inactivo') AS estado, DATE_FORMAT(u.created_at,'%Y-%m-%d %H:%i') AS creado FROM users u LEFT JOIN companies c ON c.id=u.company_id ORDER BY FIELD(u.role,'admin','company','user'), u.id;"
  titulo "Cómo se guarda realmente la contraseña (columna password_hash)"
  sql "SELECT username AS usuario, CONCAT(LEFT(password_hash,29),'…') AS hash_bcrypt FROM users ORDER BY id;"
  titulo "Empresas registradas"
  sql "SELECT c.name AS empresa, c.legal_name AS razon_social, c.email AS correo, c.phone AS telefono, c.tier AS nivel, (SELECT COUNT(*) FROM users x WHERE x.company_id=c.id) AS usuarios FROM companies c ORDER BY c.id;"
  pausa
fi

if mostrar pedidos; then
  titulo "5. Pedidos (orders) — más recientes primero"
  sql "SELECT o.code AS pedido, u.username AS cliente, o.status AS estado, o.item_count AS unidades, o.subtotal, CONCAT(o.discount_percent,'%') AS descuento, o.total, o.payment_label AS pago, DATE_FORMAT(o.created_at,'%Y-%m-%d %H:%i') AS fecha FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 15;"
  titulo "Líneas del último pedido (order_items)"
  sql "SELECT o.code AS pedido, i.reference AS referencia, i.product_name AS producto, i.quantity AS cantidad, i.unit_price AS precio_u, i.line_total AS total_linea FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.id=(SELECT MAX(id) FROM orders);"
  titulo "Carritos actuales (cart_items)"
  sql "SELECT u.username AS usuario, p.name AS producto, c.quantity AS cantidad FROM cart_items c JOIN users u ON u.id=c.user_id JOIN products p ON p.id=c.product_id;"
  pausa
fi

if mostrar facturas; then
  titulo "6. Facturas de empresas (invoices)"
  sql "SELECT i.code AS factura, co.name AS empresa, o.code AS pedido, i.amount AS monto, i.status AS estado, i.due_at AS vence, DATE_FORMAT(i.paid_at,'%Y-%m-%d') AS pagada FROM invoices i JOIN companies co ON co.id=i.company_id JOIN orders o ON o.id=i.order_id ORDER BY i.id DESC;"
  pausa
fi

if mostrar empresa; then
  titulo "7. Empresas: crédito y puntos (companies)"
  sql "SELECT name AS empresa, tax_id AS rfc_nit, tier AS nivel, credit_limit AS credito, credit_used AS usado, credit_limit-credit_used AS disponible, points AS puntos FROM companies;"
  titulo "Ventas por categoría (consulta del reporte)"
  sql "SELECT oi.category_name AS categoria, SUM(oi.quantity) AS unidades, ROUND(SUM(oi.line_total*(1-o.discount_percent/100)),2) AS ventas FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE o.status<>'cancelled' GROUP BY oi.category_name ORDER BY ventas DESC;"
  pausa
fi

if mostrar integridad; then
  titulo "8. Integridad: la base rechaza datos inválidos"
  nota "Intento de insertar un producto con una referencia que ya existe (UNIQUE):"
  printf '\033[0;90mSQL> INSERT INTO products (reference,name,brand_id,category_id) VALUES (%s);\033[0m\n' "'PLC-STD-12','Duplicado',1,1"
  $DB -e "INSERT INTO products (reference,name,brand_id,category_id) VALUES ('PLC-STD-12','Duplicado',1,1);" 2>&1 | grep ERROR | sed "s/^/  → /"
  nota "Intento de usar una categoría que no existe (FOREIGN KEY):"
  printf '\033[0;90mSQL> INSERT INTO products (reference,name,brand_id,category_id) VALUES (%s);\033[0m\n' "'NUEVO-1','Prueba',1,999"
  $DB -e "INSERT INTO products (reference,name,brand_id,category_id) VALUES ('NUEVO-1','Prueba',1,999);" 2>&1 | grep ERROR | sed "s/^/  → /"
fi

printf '\n\033[1;32m✔ Fin del recorrido. Consola SQL libre: zertica-db\033[0m\n'
