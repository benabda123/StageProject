-- Attendance Service Database Schema

CREATE TABLE IF NOT EXISTS attendance_records (
  id              SERIAL PRIMARY KEY,
  employee_id     VARCHAR(255) NOT NULL,        -- Keycloak sub (UUID)
  employee_username VARCHAR(255) NOT NULL,
  check_in_time   TIMESTAMP NOT NULL,
  check_out_time  TIMESTAMP,                    -- NULL until check-out
  check_in_lat    DECIMAL(10, 7) NOT NULL,      -- GPS latitude at check-in
  check_in_lng    DECIMAL(10, 7) NOT NULL,      -- GPS longitude at check-in
  check_out_lat   DECIMAL(10, 7),               -- GPS latitude at check-out
  check_out_lng   DECIMAL(10, 7),               -- GPS longitude at check-out
  distance_meters DECIMAL(8, 2) NOT NULL,       -- Distance from office at check-in
  work_date       DATE NOT NULL,                -- The work day (YYYY-MM-DD)
  duration_minutes INTEGER,                     -- Computed on check-out
  status          VARCHAR(20) NOT NULL DEFAULT 'present'
                  CHECK (status IN ('present', 'checked_out')),
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One record per employee per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_employee_date
  ON attendance_records(employee_id, work_date);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id
  ON attendance_records(employee_id);

CREATE INDEX IF NOT EXISTS idx_attendance_work_date
  ON attendance_records(work_date);

CREATE INDEX IF NOT EXISTS idx_attendance_status
  ON attendance_records(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_attendance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_attendance_updated_at();
