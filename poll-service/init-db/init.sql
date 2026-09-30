-- Poll Service Database Schema

-- Table polls : un sondage créé par un admin
CREATE TABLE IF NOT EXISTS polls (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(500) NOT NULL,
  description   TEXT,
  options       JSONB NOT NULL DEFAULT '[]',  -- [{ id, text }]
  deadline      TIMESTAMP NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'closed')),
  is_anonymous  BOOLEAN NOT NULL DEFAULT false,
  created_by    VARCHAR(255) NOT NULL,         -- username de l'admin
  created_by_id VARCHAR(255) NOT NULL,         -- sub Keycloak de l'admin
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table votes : un vote par employee par sondage
CREATE TABLE IF NOT EXISTS votes (
  id                 SERIAL PRIMARY KEY,
  poll_id            INTEGER NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  employee_id        VARCHAR(255) NOT NULL,    -- sub Keycloak
  employee_username  VARCHAR(255) NOT NULL,
  option_id          VARCHAR(255) NOT NULL,    -- ID de l'option choisie
  voted_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Un seul vote par employee par sondage
  CONSTRAINT unique_employee_poll UNIQUE (poll_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_polls_status     ON polls(status);
CREATE INDEX IF NOT EXISTS idx_polls_deadline   ON polls(deadline);
CREATE INDEX IF NOT EXISTS idx_polls_created_by ON polls(created_by_id);
CREATE INDEX IF NOT EXISTS idx_votes_poll_id    ON votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_votes_employee   ON votes(employee_id);
