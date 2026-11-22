-- =============================================================================
-- ZERTICA – Drywall Shop · Esquema de base de datos (MySQL 8)
-- Base: zertica · utf8mb4 · InnoDB · 5 tablas (users, categories, brands,
-- products, product_features). No se agregan tablas (sección 11 de la
-- especificación).
--
-- Reconstruido a partir de la "Especificación integral" (secciones 11 y 12,
-- diagrama E-R). El schema.sql original del equipo no estaba disponible.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS zertica
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE zertica;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS product_features;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS brands;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

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
  role           ENUM('user','admin') NOT NULL DEFAULT 'user',
  language       ENUM('es','en')  NOT NULL DEFAULT 'es',
  is_active      TINYINT(1)       NOT NULL DEFAULT 1,
  created_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role_active (role, is_active)
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
