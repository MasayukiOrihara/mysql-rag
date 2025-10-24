CREATE DATABASE IF NOT EXISTS ragdb;
USE ragdb;

CREATE TABLE docs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  content    MEDIUMTEXT NOT NULL,
  -- embedding  VECTOR(1536) NOT NULL,         -- 例: text-embedding-3-small
  metadata   JSON NULL,                      -- 任意のオブジェクトをJSONで
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_created_at (created_at)
);
