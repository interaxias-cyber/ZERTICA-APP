-- =============================================================================
-- ZERTICA · Datos iniciales de PRUEBA (solo desarrollo)
--
-- Catálogo: 4 categorías, 3 marcas, 6 productos y 5 características, como
-- indica la especificación (sección 11). Los ejemplos explícitos de la
-- documentación se respetan literalmente:
--   · Referencia "PLC-STD-12", nombre "Placa de yeso estándar 1/2\"",
--     categoría "Placas y paneles", marca "Marca Alfa" (presentación, lám. 8).
--   · Categorías "Placas y paneles" y "Perfilería" (presentación, lám. 5).
--   · Característica "Espesor · 12.7 mm" (presentación, lám. 5).
--   · GET /api/products?search=PLC&category_id=1 devuelve total = 2.
-- El resto de registros es RECONSTRUIDO (placas, perfilería, tornillería y
-- masillas, sección 2) porque el schema.sql original no estaba disponible.
-- Imágenes: fotografías tomadas del diseño de Figma (24 pantallas). Los
-- archivos están en database/seed-images/ y `npm run db:init` los copia a
-- uploads/products/. Si se carga este SQL a mano, copie esa carpeta también.
--
-- Usuarios de prueba, tomados del diseño de Figma (credenciales de demo del
-- acceso administrativo y lista de usuarios). Contraseñas en texto plano SOLO
-- en la documentación; en la base se guarda el hash bcrypt:
--   admin  / admin@zertica.com / Admin2026#     rol admin, activo
--   juan   / juan@mail.com     / Usuario2026#   rol user,  activo
--   maria  / maria@mail.com    / Usuario2026#   rol user,  activo
--   pedro  / pedro@mail.com    / Inactivo2026#  rol user,  DESACTIVADO (RN05)
-- Se puede iniciar sesión con el nombre de usuario o con el correo.
--
-- Ampliación v2 (rol Empresa):
--   constructora / xyz@empresa.com  / Empresa2026#  rol company, Constructora XYZ (premium)
--   buildpro     / build@pro.com    / Empresa2026#  rol company, BuildPro MX
-- Pedidos, facturas, direcciones, tarjetas (solo últimos 4 dígitos), contactos
-- y mensajes de ejemplo. Las fechas de los pedidos son relativas al momento de
-- cargar este archivo, para que el panel y los reportes siempre tengan datos.
-- =============================================================================

USE zertica;

INSERT INTO categories (id, name, is_active) VALUES
  (1, 'Placas y paneles', 1),
  (2, 'Perfilería', 1),
  (3, 'Tornillería', 1),
  (4, 'Masillas', 1);

INSERT INTO brands (id, name) VALUES
  (1, 'Marca Alfa'),
  (2, 'Marca Beta'),
  (3, 'Marca Gamma');

INSERT INTO products (id, reference, name, description, image_url, brand_id, category_id, is_active) VALUES
  (1, 'PLC-STD-12', 'Placa de yeso estándar 1/2"',
     'Placa de yeso para muros y cielos rasos interiores en sistemas de construcción en seco.',
     '/uploads/products/seed-plc-std-12.jpg', 1, 1, 1),
  (2, 'PLC-RH-12', 'Placa de yeso resistente a la humedad 1/2"',
     'Placa de yeso con aditivos hidrófugos para baños, cocinas y zonas húmedas interiores.',
     '/uploads/products/seed-plc-rh-12.jpg', 2, 1, 1),
  (3, 'PRF-CAN-36', 'Perfil canal 3.6 m',
     'Perfil metálico galvanizado tipo canal para estructuras de muros y cielos en drywall.',
     '/uploads/products/seed-prf-can-36.jpg', 1, 2, 1),
  (4, 'PRF-PST-36', 'Perfil poste 3.6 m',
     'Perfil metálico galvanizado tipo poste (parante) para estructuras de muros en drywall.',
     '/uploads/products/seed-prf-pst-36.jpg', 3, 2, 1),
  (5, 'TRN-PAN-1', 'Tornillo punta aguja 1"',
     'Tornillo autorroscante punta aguja para fijar placas de yeso a perfilería metálica.',
     '/uploads/products/seed-trn-pan-1.jpg', 2, 3, 1),
  (6, 'MAS-MP-5', 'Masilla multipropósito 5 kg',
     'Masilla lista para usar en tratamiento de juntas, encintado y acabado de placas de yeso.',
     '/uploads/products/seed-mas-mp-5.jpg', 3, 4, 1);

INSERT INTO product_features (product_id, name, value) VALUES
  (1, 'Espesor', '12.7 mm'),
  (1, 'Dimensiones', '1.22 x 2.44 m'),
  (2, 'Espesor', '12.7 mm'),
  (3, 'Longitud', '3.6 m'),
  (6, 'Peso', '5 kg');

INSERT INTO users (username, full_name, email, password_hash, role, language, is_active) VALUES
  ('admin', 'Administrador', 'admin@zertica.com',
     '$2b$10$oBIu//ZDdG0L3Hk1jT1Zs.IUM.9VXEoC5K9obGmm54G8DSj4YR1vy', 'admin', 'es', 1),
  ('juan', 'Juan García', 'juan@mail.com',
     '$2b$10$7R5fPGxxGbLlI5M3zACnwecazJRox71Pb2f86piThjHIG86A6x0r.', 'user', 'es', 1),
  ('maria', 'María López', 'maria@mail.com',
     '$2b$10$7R5fPGxxGbLlI5M3zACnwecazJRox71Pb2f86piThjHIG86A6x0r.', 'user', 'es', 1),
  ('pedro', 'Pedro Ramírez', 'pedro@mail.com',
     '$2b$10$9rTOuZnAJZLf8VGY5Ayh7.Qx9hrFEPRYjsjmsgPrSkrm94IDnDIUy', 'user', 'es', 0);

-- =============================================================================
-- Ampliación v2 · datos de PRUEBA
-- =============================================================================

-- Precio y stock (valores del diseño de Figma).
UPDATE products SET price = 185.00, stock = 240 WHERE reference = 'PLC-STD-12';
UPDATE products SET price = 210.00, stock = 180 WHERE reference = 'PLC-RH-12';
UPDATE products SET price = 95.00,  stock = 520 WHERE reference = 'PRF-CAN-36';
UPDATE products SET price = 105.00, stock = 480 WHERE reference = 'PRF-PST-36';
UPDATE products SET price = 32.00,  stock = 1200 WHERE reference = 'TRN-PAN-1';
UPDATE products SET price = 320.00, stock = 90  WHERE reference = 'MAS-MP-5';

INSERT INTO companies (id, name, legal_name, tax_id, tax_regime, fiscal_address, phone, email, tier, credit_limit, points) VALUES
  (1, 'Constructora XYZ', 'Constructora XYZ S.A. de C.V.', 'CXYZ001122ABC', 'Persona Moral',
     'Av. Reforma 123, CDMX', '+52 55 0000 1111', 'admin@constructoraxyz.com', 'premium', 500000.00, 4850),
  (2, 'BuildPro MX', 'BuildPro México S.A. de C.V.', 'BPM990101XY1', 'Persona Moral',
     'Calz. de Tlalpan 880, CDMX', '+52 55 2222 3333', 'build@pro.com', 'standard', 150000.00, 1200);

INSERT INTO users (id, username, full_name, email, password_hash, role, company_id, language, is_active) VALUES
  (101, 'constructora', 'Constructora XYZ', 'xyz@empresa.com', '$2b$10$PyP6L2hutMidEyKgnYpMr.OiWTnoaMlUTS.ZbHWOcVcyi1nhlhMgS', 'company', 1, 'es', 1),
  (102, 'buildpro', 'BuildPro MX', 'build@pro.com', '$2b$10$PyP6L2hutMidEyKgnYpMr.OiWTnoaMlUTS.ZbHWOcVcyi1nhlhMgS', 'company', 2, 'es', 1);
UPDATE users SET phone = '+52 55 1234 5678' WHERE username = 'juan';

INSERT INTO addresses (user_id, label, line1, city, postal_code, is_default)
SELECT id, 'Casa', 'Calle Juárez 45, Col. Centro', 'CDMX', '06000', 1 FROM users WHERE username = 'juan'
UNION ALL SELECT id, 'Oficina', 'Av. Insurgentes 1456, Col. Del Valle', 'CDMX', '03100', 0 FROM users WHERE username = 'juan'
UNION ALL SELECT id, 'Casa', 'Calle Hidalgo 12, Coyoacán', 'CDMX', '04000', 1 FROM users WHERE username = 'maria'
UNION ALL SELECT 101, 'Obra Norte', 'Av. Politécnico 2100, Lindavista', 'CDMX', '07300', 1
UNION ALL SELECT 101, 'Bodega central', 'Eje 5 Norte 990, Azcapotzalco', 'CDMX', '02000', 0
UNION ALL SELECT 101, 'Obra Sur', 'Periférico Sur 4500, Tlalpan', 'CDMX', '14000', 0
UNION ALL SELECT 102, 'Almacén', 'Calz. de Tlalpan 880', 'CDMX', '03340', 1;

INSERT INTO payment_methods (user_id, brand, last4, exp_month, exp_year, holder_name, is_default)
SELECT id, 'visa', '4242', 12, 2027, 'JUAN GARCIA', 1 FROM users WHERE username = 'juan'
UNION ALL SELECT id, 'mastercard', '5555', 8, 2028, 'JUAN GARCIA', 0 FROM users WHERE username = 'juan'
UNION ALL SELECT id, 'visa', '1881', 3, 2029, 'MARIA LOPEZ', 1 FROM users WHERE username = 'maria'
UNION ALL SELECT 101, 'visa', '0005', 6, 2028, 'CONSTRUCTORA XYZ', 1;

INSERT INTO account_contacts (company_id, full_name, title, phone, sort_order) VALUES
  (1, 'Arq. Roberto Silva', 'Asesor comercial', '+52 55 1234 5678', 1),
  (1, 'Ing. Carmen Ruiz', 'Soporte técnico', '+52 55 9876 5432', 2),
  (1, 'Lic. Mario Torres', 'Facturación', '+52 55 5555 0000', 3),
  (2, 'Arq. Roberto Silva', 'Asesor comercial', '+52 55 1234 5678', 1);

INSERT INTO support_messages (user_id, message)
SELECT id, '¿Tienen placas de yeso de 5/8" resistentes al fuego?' FROM users WHERE username = 'maria';

-- Pedidos (id fijo; totales calculados abajo a partir de las líneas).
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (1, (SELECT id FROM users WHERE username='juan'), NULL, 'completed', 0, 'card', 'Visa •••• 4242', 'Casa · Calle Juárez 45, Col. Centro, CDMX 06000', DATE_SUB(NOW(), INTERVAL 58 DAY) - INTERVAL 37 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 1, p.id, p.name, p.reference, c.name, p.price, 4, p.price * 4 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 1;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 1, p.id, p.name, p.reference, c.name, p.price, 2, p.price * 2 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 3;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (2, (SELECT id FROM users WHERE username='juan'), NULL, 'cancelled', 0, 'card', 'Visa •••• 4242', 'Casa · Calle Juárez 45, Col. Centro, CDMX 06000', DATE_SUB(NOW(), INTERVAL 40 DAY) - INTERVAL 74 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 2, p.id, p.name, p.reference, c.name, p.price, 5, p.price * 5 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 6;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 2, p.id, p.name, p.reference, c.name, p.price, 10, p.price * 10 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 5;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (3, 101, 1, 'completed', 5, 'credit', 'Crédito empresarial', 'Obra Norte · Av. Politécnico 2100, Lindavista, CDMX 07300', DATE_SUB(NOW(), INTERVAL 70 DAY) - INTERVAL 111 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 3, p.id, p.name, p.reference, c.name, p.price, 40, p.price * 40 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 1;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 3, p.id, p.name, p.reference, c.name, p.price, 30, p.price * 30 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 3;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (4, 101, 1, 'completed', 10, 'credit', 'Crédito empresarial', 'Obra Norte · Av. Politécnico 2100, Lindavista, CDMX 07300', DATE_SUB(NOW(), INTERVAL 45 DAY) - INTERVAL 148 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 4, p.id, p.name, p.reference, c.name, p.price, 60, p.price * 60 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 2;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 4, p.id, p.name, p.reference, c.name, p.price, 40, p.price * 40 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 4;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (5, 101, 1, 'completed', 10, 'transfer', 'Transferencia bancaria', 'Bodega central · Eje 5 Norte 990, Azcapotzalco, CDMX 02000', DATE_SUB(NOW(), INTERVAL 25 DAY) - INTERVAL 185 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 5, p.id, p.name, p.reference, c.name, p.price, 120, p.price * 120 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 1;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 5, p.id, p.name, p.reference, c.name, p.price, 200, p.price * 200 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 5;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 5, p.id, p.name, p.reference, c.name, p.price, 20, p.price * 20 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 6;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (6, (SELECT id FROM users WHERE username='juan'), NULL, 'completed', 0, 'card', 'Mastercard •••• 5555', 'Oficina · Av. Insurgentes 1456, Col. Del Valle, CDMX 03100', DATE_SUB(NOW(), INTERVAL 20 DAY) - INTERVAL 222 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 6, p.id, p.name, p.reference, c.name, p.price, 2, p.price * 2 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 4;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 6, p.id, p.name, p.reference, c.name, p.price, 5, p.price * 5 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 5;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (7, 102, 2, 'completed', 10, 'credit', 'Crédito empresarial', 'Almacén · Calz. de Tlalpan 880, CDMX 03340', DATE_SUB(NOW(), INTERVAL 10 DAY) - INTERVAL 259 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 7, p.id, p.name, p.reference, c.name, p.price, 60, p.price * 60 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 3;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 7, p.id, p.name, p.reference, c.name, p.price, 60, p.price * 60 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 4;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (8, 101, 1, 'processing', 18, 'credit', 'Crédito empresarial', 'Obra Sur · Periférico Sur 4500, Tlalpan, CDMX 14000', DATE_SUB(NOW(), INTERVAL 6 DAY) - INTERVAL 296 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 8, p.id, p.name, p.reference, c.name, p.price, 300, p.price * 300 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 1;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 8, p.id, p.name, p.reference, c.name, p.price, 150, p.price * 150 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 3;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 8, p.id, p.name, p.reference, c.name, p.price, 100, p.price * 100 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 4;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (9, (SELECT id FROM users WHERE username='juan'), NULL, 'processing', 0, 'card', 'Visa •••• 4242', 'Casa · Calle Juárez 45, Col. Centro, CDMX 06000', DATE_SUB(NOW(), INTERVAL 3 DAY) - INTERVAL 33 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 9, p.id, p.name, p.reference, c.name, p.price, 10, p.price * 10 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 1;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 9, p.id, p.name, p.reference, c.name, p.price, 6, p.price * 6 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 2;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (10, (SELECT id FROM users WHERE username='maria'), NULL, 'shipped', 0, 'card', 'Visa •••• 1881', 'Casa · Calle Hidalgo 12, Coyoacán, CDMX 04000', DATE_SUB(NOW(), INTERVAL 2 DAY) - INTERVAL 70 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 10, p.id, p.name, p.reference, c.name, p.price, 3, p.price * 3 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 6;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 10, p.id, p.name, p.reference, c.name, p.price, 4, p.price * 4 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 5;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (11, (SELECT id FROM users WHERE username='maria'), NULL, 'completed', 0, 'card', 'Visa •••• 1881', 'Casa · Calle Hidalgo 12, Coyoacán, CDMX 04000', DATE_SUB(NOW(), INTERVAL 1 DAY) - INTERVAL 107 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 11, p.id, p.name, p.reference, c.name, p.price, 4, p.price * 4 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 2;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (12, 101, 1, 'pending', 10, 'transfer', 'Transferencia bancaria', 'Obra Norte · Av. Politécnico 2100, Lindavista, CDMX 07300', DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 144 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 12, p.id, p.name, p.reference, c.name, p.price, 80, p.price * 80 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 2;
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 12, p.id, p.name, p.reference, c.name, p.price, 30, p.price * 30 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 6;
INSERT INTO orders (id, user_id, company_id, status, discount_percent, payment_type, payment_label, shipping_address, created_at) VALUES (13, (SELECT id FROM users WHERE username='juan'), NULL, 'pending', 0, 'transfer', 'Transferencia bancaria', 'Casa · Calle Juárez 45, Col. Centro, CDMX 06000', DATE_SUB(NOW(), INTERVAL 0 DAY) - INTERVAL 181 MINUTE);
INSERT INTO order_items (order_id, product_id, product_name, reference, category_name, unit_price, quantity, line_total) SELECT 13, p.id, p.name, p.reference, c.name, p.price, 6, p.price * 6 FROM products p JOIN categories c ON c.id = p.category_id WHERE p.id = 3;

UPDATE orders SET code = CONCAT('Z-', LPAD(id, 4, '0'));
UPDATE orders o
JOIN (SELECT order_id, SUM(line_total) AS s, SUM(quantity) AS q FROM order_items GROUP BY order_id) t ON t.order_id = o.id
SET o.subtotal = t.s, o.item_count = t.q,
    o.discount = ROUND(t.s * o.discount_percent / 100, 2),
    o.total = t.s - ROUND(t.s * o.discount_percent / 100, 2),
    o.updated_at = o.created_at;

-- Facturas de los pedidos de empresa.
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'overdue', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, NULL FROM orders WHERE id = 3;
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'paid', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, DATE_SUB(NOW(), INTERVAL 40 DAY) FROM orders WHERE id = 4;
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'paid', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, DATE_SUB(NOW(), INTERVAL 20 DAY) FROM orders WHERE id = 5;
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'paid', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, DATE_SUB(NOW(), INTERVAL 5 DAY) FROM orders WHERE id = 7;
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'pending', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, NULL FROM orders WHERE id = 8;
INSERT INTO invoices (order_id, company_id, amount, status, issued_at, due_at, paid_at) SELECT id, company_id, total, 'pending', DATE(created_at), DATE(created_at) + INTERVAL 30 DAY, NULL FROM orders WHERE id = 12;
UPDATE invoices SET code = CONCAT('FAC-', YEAR(issued_at), '-', LPAD(id, 4, '0'));
UPDATE companies c SET credit_used = (SELECT COALESCE(SUM(i.amount), 0) FROM invoices i WHERE i.company_id = c.id AND i.status IN ('pending', 'overdue'));
