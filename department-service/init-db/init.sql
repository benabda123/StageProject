CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO departments (name, description) VALUES
('Engineering', 'Software engineering, DevOps, and Quality Assurance'),
('Human Resources', 'Talent acquisition, employee relations, and HR policies'),
('Marketing', 'Digital marketing, design, and brand communication');