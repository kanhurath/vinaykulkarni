-- ============================================================
-- CMS Schema for vkulkarni-react database
-- Run in phpMyAdmin or via: mysql -u root vkulkarni-react < schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS `vkulkarni-react`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `vkulkarni-react`;

-- ── Biography: Hero section ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_hero (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  eyebrow     VARCHAR(200)  NOT NULL DEFAULT '',
  title       VARCHAR(200)  NOT NULL DEFAULT '',
  title_em    VARCHAR(200)  NOT NULL DEFAULT '',
  subtitle    TEXT,
  breadcrumb  VARCHAR(100)  NOT NULL DEFAULT '',
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Biography: Profile section ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_profile (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200)  NOT NULL DEFAULT '',
  tagline         TEXT,
  quote           TEXT,
  para1           TEXT,
  para2           TEXT,
  linkedin_url    VARCHAR(500)  DEFAULT NULL,
  twitter_handle  VARCHAR(100)  DEFAULT NULL,
  twitter_url     VARCHAR(500)  DEFAULT NULL,
  photo_url       VARCHAR(500)  DEFAULT NULL,
  updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Biography: Engage section — intro ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_engage_intro (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  section_label VARCHAR(200)  NOT NULL DEFAULT '',
  title         VARCHAR(200)  NOT NULL DEFAULT '',
  title_em      VARCHAR(200)  NOT NULL DEFAULT '',
  description   TEXT,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Biography: Engage section — cards ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_engage_cards (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sort_order    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  num_label     VARCHAR(10)   NOT NULL DEFAULT '',
  category      VARCHAR(100)  NOT NULL DEFAULT '',
  title         VARCHAR(200)  NOT NULL DEFAULT '',
  slug          VARCHAR(200)  NOT NULL DEFAULT '',
  content_label VARCHAR(200)  NOT NULL DEFAULT '',
  count_number  VARCHAR(20)   NOT NULL DEFAULT '',
  count_label   VARCHAR(100)  NOT NULL DEFAULT '',
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Biography: Engage section — venues (child rows of cards) ──────────────────
CREATE TABLE IF NOT EXISTS bio_engage_venues (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  card_id     INT UNSIGNED NOT NULL,
  venue_text  VARCHAR(500)  NOT NULL DEFAULT '',
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  CONSTRAINT fk_venue_card FOREIGN KEY (card_id)
    REFERENCES bio_engage_cards (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Biography: Ventures section ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bio_ventures (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  logo_url    VARCHAR(500)  DEFAULT NULL,
  designation VARCHAR(200)  NOT NULL DEFAULT '',
  name        VARCHAR(200)  NOT NULL DEFAULT '',
  type        VARCHAR(200)  NOT NULL DEFAULT '',
  description TEXT,
  link_url    VARCHAR(500)  DEFAULT NULL,
  link_label  VARCHAR(200)  DEFAULT NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
