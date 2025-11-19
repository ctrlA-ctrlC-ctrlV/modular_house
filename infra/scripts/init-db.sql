-- Database initialization script for Modular House
-- This script runs when the PostgreSQL container starts for the first time

-- Create development database if it doesn't exist
-- (Note: POSTGRES_DB environment variable already creates the database)

-- Set timezone
SET timezone = 'UTC';

-- Enable extensions that might be needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy at ' || NOW();
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE modular_house_dev TO postgres;