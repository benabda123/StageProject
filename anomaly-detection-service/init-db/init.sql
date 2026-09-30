-- Anomaly Detection Service Database Schema

-- Stocke les rapports générés pour éviter de rappeler Gemini à chaque fois
CREATE TABLE IF NOT EXISTS anomaly_reports (
  id              SERIAL PRIMARY KEY,
  generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  period_days     INTEGER NOT NULL DEFAULT 30,
  total_employees INTEGER NOT NULL DEFAULT 0,
  anomaly_count   INTEGER NOT NULL DEFAULT 0,
  -- Résultats bruts JSON (anomalies détectées avant AI)
  raw_anomalies   JSONB NOT NULL DEFAULT '[]',
  -- Rapport final généré par Gemini
  ai_report       TEXT,
  -- Résumé par employé
  employee_results JSONB NOT NULL DEFAULT '[]',
  created_by      VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'completed'
                  CHECK (status IN ('pending', 'completed', 'error'))
);

CREATE INDEX IF NOT EXISTS idx_anomaly_reports_generated_at
  ON anomaly_reports(generated_at DESC);
