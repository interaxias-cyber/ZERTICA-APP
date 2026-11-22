-- =============================================================================
-- ZERTICA – Drywall Shop · Esquema de base de datos (MySQL 8)
-- Base: zertica · utf8mb4 · InnoDB.
--
-- Núcleo MVP (5 tablas de la especificación): users, categories, brands,
-- products, product_features.
-- Ampliación v2 (pantallas de Figma fuera del MVP original: carrito,
-- pedidos, direcciones, métodos de pago, ayuda, rol Empresa, facturación y
-- reportes): companies, addresses, payment_methods, cart_items, orders,
-- order_items, invoices, account_contacts, support_messages; columnas
-- products.price / products.stock y users.company_id / users.phone; rol
-- 'company'.
--
-- Reconstruido a partir de la "Especificación integral" (secciones 11 y 12,
-- diagrama E-R). El schema.sql original del equipo no estaba disponible.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS zertica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zertica;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS support_messages;
DROP TABLE IF EXISTS account_contacts;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS payment_methods;
DROP TABLE IF EXISTS addresses;
DROP TABLE IF EXISTS product_features;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS companies;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- companies (v2): cuentas empresariales del rol "Empresa" (crédito y puntos).
-- -----------------------------------------------------------------------------
CREATE TABLE companies (
  id              INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  name            VARCHAR(120)   NOT NULL,
  legal_name      VARCHAR(160)   NOT NULL,
  tax_id          VARCHAR(30)    NOT NULL,
  tax_regime      VARCHAR(80)    NOT NULL,
  fiscal_address  VARCHAR(200)   NOT NULL,
  phone           VARCHAR(30)    NOT NULL,
  email           VARCHAR(150)   NOT NULL,
  tier            ENUM('standard','premium') NOT NULL DEFAULT 'standard',
  credit_limit    DECIMAL(12,2)  NOT NULL DEFAULT 0,
  credit_used     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  points          INT UNSIGNED   NOT NULL DEFAULT 0,
  is_active       TINYINT(1)     NOT NULL DEFAULT 1,
  created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_companies_tax_id (tax_id),
  CONSTRAINT chk_companies_credit CHECK (credit_used >= 0 AND credit_limit >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- users: una cuenta por persona; el rol es un atributo (RN04).
-- La contraseña se guarda SOLO como hash bcrypt (RN03 / RNF01).
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id             INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  username       VARCHAR(50)      NOT NULL,
  full_name      VARCHAR(120)     NOT NULL,
  email          VARCHAR(150)     NOT NULL,
  password_hash  VARCHAR(255)     NOT NULL,
  role           ENUM('user','admin','company') NOT NULL DEFAULT 'user',
  company_id     INT UNSIGNED     NULL,
  phone          VARCHAR(30)      NULL,
  language       ENUM('es','en')  NOT NULL DEFAULT 'es',
  is_active      TINYINT(1)       NOT NULL DEFAULT 1,
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active),
  CONSTRAINT fk_users_company FOREIGN KEY (company_id)
    REFERENCES companies (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- categories: se desactivan, no se eliminan (RN07, RN12).
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- brands
-- -----------------------------------------------------------------------------
CREATE TABLE brands (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100)  NOT NULL,
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- products: referencia única (RN10); categoría y marca obligatorias (RN09).
-- ON DELETE RESTRICT / ON UPDATE CASCADE.
-- -----------------------------------------------------------------------------
CREATE TABLE products (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  reference    VARCHAR(50)   NOT NULL,
  name         VARCHAR(150)  NOT NULL,
  description  TEXT          NULL,
  image_url    VARCHAR(255)  NULL,
  price        DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock        INT UNSIGNED  NOT NULL DEFAULT 0,
  brand_id     INT UNSIGNED  NOT NULL,
  category_id  INT UNSIGNED  NOT NULL,
  is_active    TINYINT(1)    NOT NULL DEFAULT 1,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_reference (reference),
  KEY idx_products_category_active (category_id, is_active),
  KEY idx_products_brand_active (brand_id, is_active),
  FULLTEXT KEY ft_products_name_description (name, description),
  CONSTRAINT chk_products_price CHECK (price >= 0),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id)
    REFERENCES brands (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- product_features: clave-valor por producto; no se repite el nombre dentro
-- del mismo producto y se elimina con él (RN13).
-- -----------------------------------------------------------------------------
CREATE TABLE product_features (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED  NOT NULL,
  name        VARCHAR(100)  NOT NULL,
  value       VARCHAR(255)  NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_features_product_name (product_id, name),
  CONSTRAINT fk_product_features_product FOREIGN KEY (product_id)
    REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- Ampliación v2
-- =============================================================================

-- Direcciones de entrega del usuario (pantalla "Mis direcciones").
CREATE TABLE addresses (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  label        VARCHAR(50)   NOT NULL,
  line1        VARCHAR(200)  NOT NULL,
  city         VARCHAR(100)  NOT NULL,
  postal_code  VARCHAR(20)   NULL,
  is_default   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_addresses_user (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Métodos de pago. NUNCA se guarda el número completo ni el CVV: solo marca
-- y últimos 4 dígitos (el cobro real requeriría una pasarela de pago).
CREATE TABLE payment_methods (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  brand        ENUM('visa','mastercard','amex','other') NOT NULL,
  last4        CHAR(4)       NOT NULL,
  exp_month    TINYINT UNSIGNED NOT NULL,
  exp_year     SMALLINT UNSIGNED NOT NULL,
  holder_name  VARCHAR(120)  NOT NULL,
  is_default   TINYINT(1)    NOT NULL DEFAULT 0,
  created_at   TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_payment_methods_user (user_id),
  CONSTRAINT fk_payment_methods_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carrito: una fila por producto y usuario.
CREATE TABLE cart_items (
  user_id     INT UNSIGNED  NOT NULL,
  product_id  INT UNSIGNED  NOT NULL,
  quantity    INT UNSIGNED  NOT NULL,
  added_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, product_id),
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT chk_cart_quantity CHECK (quantity > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pedidos. La dirección y el medio de pago se copian como texto para que el
-- pedido no cambie si luego se editan.
CREATE TABLE orders (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code              VARCHAR(20)   NULL,
  user_id           INT UNSIGNED  NOT NULL,
  company_id        INT UNSIGNED  NULL,
  status            ENUM('pending','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending',
  item_count        INT UNSIGNED  NOT NULL DEFAULT 0,
  subtotal          DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_percent  DECIMAL(5,2)  NOT NULL DEFAULT 0,
  discount          DECIMAL(12,2) NOT NULL DEFAULT 0,
  total             DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_type      ENUM('card','transfer','credit') NOT NULL,
  payment_label     VARCHAR(80)   NOT NULL,
  shipping_address  VARCHAR(300)  NOT NULL,
  notes             VARCHAR(500)  NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_code (code),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status_created (status, created_at),
  KEY idx_orders_company (company_id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_orders_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Líneas del pedido (copia de nombre, referencia, categoría y precio).
CREATE TABLE order_items (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id       INT UNSIGNED  NOT NULL,
  product_id     INT UNSIGNED  NOT NULL,
  product_name   VARCHAR(150)  NOT NULL,
  reference      VARCHAR(50)   NOT NULL,
  category_name  VARCHAR(100)  NOT NULL,
  unit_price     DECIMAL(12,2) NOT NULL,
  quantity       INT UNSIGNED  NOT NULL,
  line_total     DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Facturas de las cuentas Empresa (pantalla "Facturación").
CREATE TABLE invoices (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  code        VARCHAR(20)   NULL,
  order_id    INT UNSIGNED  NOT NULL,
  company_id  INT UNSIGNED  NOT NULL,
  amount      DECIMAL(12,2) NOT NULL,
  status      ENUM('pending','paid','overdue','cancelled') NOT NULL DEFAULT 'pending',
  issued_at   DATE          NOT NULL,
  due_at      DATE          NOT NULL,
  paid_at     DATETIME      NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invoices_code (code),
  UNIQUE KEY uq_invoices_order (order_id),
  KEY idx_invoices_company_status (company_id, status),
  CONSTRAINT fk_invoices_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
  CONSTRAINT fk_invoices_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Equipo de cuenta asignado a una empresa (pantalla "Mis contactos").
CREATE TABLE account_contacts (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  company_id  INT UNSIGNED  NOT NULL,
  full_name   VARCHAR(120)  NOT NULL,
  title       VARCHAR(80)   NOT NULL,
  phone       VARCHAR(30)   NOT NULL,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_contacts_company (company_id),
  CONSTRAINT fk_contacts_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Mensajes de "Ayuda y soporte".
CREATE TABLE support_messages (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED  NOT NULL,
  message     VARCHAR(1000) NOT NULL,
  status      ENUM('open','closed') NOT NULL DEFAULT 'open',
  created_at  TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_support_user (user_id),
  CONSTRAINT fk_support_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
