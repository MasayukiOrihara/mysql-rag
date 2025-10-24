CREATE DATABASE IF NOT EXISTS ragdb;
USE ragdb;

CREATE TABLE embeddings (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_id       VARCHAR(128) NOT NULL,
  dim          INT NOT NULL,                          -- 次元数の明示
  vec_f32      LONGBLOB NOT NULL,                     -- Float32 をパックしたバイナリ
  meta         JSON NULL,                             -- 任意メタデータ
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_doc_id (doc_id),
  KEY idx_created_at (created_at),
  CHECK (dim > 0)
);
