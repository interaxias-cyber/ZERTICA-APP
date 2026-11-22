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
-- Los productos no tienen imagen, igual que los datos originales (decisión 8).
--
-- Usuarios de prueba (contraseñas en texto plano SOLO en la documentación;
-- en la base se guarda el hash bcrypt):
--   admin    / Admin123*     rol admin, activo
--   usuario  / Usuario123*   rol user,  activo
--   inactivo / Inactivo123*  rol user,  DESACTIVADO (para probar RN05)
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
     NULL, 1, 1, 1),
  (2, 'PLC-RH-12', 'Placa de yeso resistente a la humedad 1/2"',
     'Placa de yeso con aditivos hidrófugos para baños, cocinas y zonas húmedas interiores.',
     NULL, 2, 1, 1),
  (3, 'PRF-CAN-36', 'Perfil canal 3.6 m',
     'Perfil metálico galvanizado tipo canal para estructuras de muros y cielos en drywall.',
     NULL, 1, 2, 1),
  (4, 'PRF-PST-36', 'Perfil poste 3.6 m',
     'Perfil metálico galvanizado tipo poste (parante) para estructuras de muros en drywall.',
     NULL, 3, 2, 1),
  (5, 'TRN-PAN-1', 'Tornillo punta aguja 1"',
     'Tornillo autorroscante punta aguja para fijar placas de yeso a perfilería metálica.',
     NULL, 2, 3, 1),
  (6, 'MAS-MP-5', 'Masilla multipropósito 5 kg',
     'Masilla lista para usar en tratamiento de juntas, encintado y acabado de placas de yeso.',
     NULL, 3, 4, 1);

INSERT INTO product_features (product_id, name, value) VALUES
  (1, 'Espesor', '12.7 mm'),
  (1, 'Dimensiones', '1.22 x 2.44 m'),
  (2, 'Espesor', '12.7 mm'),
  (3, 'Longitud', '3.6 m'),
  (6, 'Peso', '5 kg');

INSERT INTO users (username, full_name, email, password_hash, role, language, is_active) VALUES
  ('admin', 'Administrador Zertica', 'admin@zertica.local',
     '$2b$10$3PRylZIOY60.lwqvDe/JY.AmrmFkpM4jRupZa1vkoFTCQICZKsGNa', 'admin', 'es', 1),
  ('usuario', 'Usuario de Prueba', 'usuario@zertica.local',
     '$2b$10$SjbmqAJ5k0sTmD4XzaBkd.Lx30HNuxOMM1hxXAfxFMea8ZJnhtM7C', 'user', 'es', 1),
  ('inactivo', 'Cuenta Desactivada', 'inactivo@zertica.local',
     '$2b$10$Zi2dAkuyfFu1awDnpHFrFOmIJho4mUenYSTTncdejiD0Dv0SewNKi', 'user', 'es', 0);
