-- ============================================================
-- Learning Service — init.sql
-- Table: favorite_trainings
-- ============================================================

CREATE TABLE IF NOT EXISTS favorite_trainings (
  id          SERIAL PRIMARY KEY,
  employee_id VARCHAR NOT NULL,           -- sub Keycloak, jamais fourni par le client
  video_id    VARCHAR NOT NULL,           -- ID YouTube de la vidéo
  title       VARCHAR NOT NULL,
  thumbnail   VARCHAR,
  url         VARCHAR NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  -- Contrainte unique : un utilisateur ne peut pas mettre en favori la même vidéo deux fois
  CONSTRAINT unique_employee_video UNIQUE (employee_id, video_id)
);

-- Index pour accélérer les requêtes par utilisateur
CREATE INDEX IF NOT EXISTS idx_favorite_trainings_employee_id ON favorite_trainings(employee_id);
