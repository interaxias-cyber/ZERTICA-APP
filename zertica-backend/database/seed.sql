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
