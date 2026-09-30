-- Meeting Rooms Table
CREATE TABLE IF NOT EXISTS meeting_rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    equipment TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meeting_rooms_name ON meeting_rooms(name);

-- Meetings Table
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL CHECK (end_time > start_time),
    type VARCHAR(20) NOT NULL CHECK (type IN ('ONLINE', 'PRESENTIEL')),
    room_id INTEGER REFERENCES meeting_rooms(id) ON DELETE SET NULL,
    meeting_link VARCHAR(500),
    meeting_platform VARCHAR(30),
    google_event_id VARCHAR(255),
    participants TEXT[] DEFAULT '{}',
    created_by_id VARCHAR(255) NOT NULL,
    created_by_username VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CHANGE_REQUEST_PENDING', 'CANCELLED')),
    change_request_data JSONB,
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_room_id ON meetings(room_id);
CREATE INDEX IF NOT EXISTS idx_meetings_created_by_id ON meetings(created_by_id);
CREATE INDEX IF NOT EXISTS idx_meetings_type ON meetings(type);

-- Google OAuth Tokens Table
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_google_oauth_tokens_user_id ON google_oauth_tokens(user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_meeting_rooms_updated_at BEFORE UPDATE ON meeting_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_google_oauth_tokens_updated_at BEFORE UPDATE ON google_oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
