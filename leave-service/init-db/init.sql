CREATE TABLE IF NOT EXISTS leaves (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  employee_username VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('annuel', 'maladie', 'personnel', 'sans_solde')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'accepte', 'refuse')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leaves_employee_id ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
