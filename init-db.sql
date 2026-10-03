-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (collaborator identity)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    avatar_color VARCHAR(20) DEFAULT '#2563eb',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Boards table (room metadata)
CREATE TABLE IF NOT EXISTS boards (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Whiteboard',
    owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Board Snapshots table (JSONB vector elements state)
CREATE TABLE IF NOT EXISTS board_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id VARCHAR(100) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    elements JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast snapshot retrieval by board_id ordered by latest
CREATE INDEX IF NOT EXISTS idx_board_snapshots_board_id ON board_snapshots(board_id, saved_at DESC);

-- GIN index for deep querying inside JSONB whiteboard elements (e.g. text search)
CREATE INDEX IF NOT EXISTS idx_board_snapshots_elements_gin ON board_snapshots USING GIN (elements);

-- Auto-update updated_at timestamp on boards table
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_boards_timestamp ON boards;
CREATE TRIGGER trigger_update_boards_timestamp
    BEFORE UPDATE ON boards
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();
