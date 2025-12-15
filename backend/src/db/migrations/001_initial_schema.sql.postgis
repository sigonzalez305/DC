-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Wards table (DC has 8 wards)
CREATE TABLE IF NOT EXISTS wards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  geom GEOMETRY(MULTIPOLYGON, 4326),
  population INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create spatial index on wards geometry
CREATE INDEX IF NOT EXISTS idx_wards_geom ON wards USING GIST(geom);

-- Sources table (social media accounts, government feeds, etc.)
CREATE TABLE IF NOT EXISTS sources (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('twitter', 'instagram', 'reddit', 'nextdoor', 'government', 'other')),
  handle VARCHAR(255),
  refresh_rate_minutes INTEGER NOT NULL DEFAULT 60,
  last_fetched_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signals table (individual posts/messages)
CREATE TABLE IF NOT EXISTS signals (
  id SERIAL PRIMARY KEY,
  source_id INTEGER NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  title VARCHAR(500),
  body TEXT NOT NULL,
  author VARCHAR(255),
  url TEXT,
  sentiment VARCHAR(20) NOT NULL CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  sentiment_score DECIMAL(3, 2) NOT NULL CHECK (sentiment_score BETWEEN -1 AND 1),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  location GEOMETRY(POINT, 4326),
  ward_id INTEGER REFERENCES wards(id),
  keywords TEXT[],
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_signals_source_id ON signals(source_id);
CREATE INDEX IF NOT EXISTS idx_signals_timestamp ON signals(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_signals_ward_id ON signals(ward_id);
CREATE INDEX IF NOT EXISTS idx_signals_sentiment ON signals(sentiment);
CREATE INDEX IF NOT EXISTS idx_signals_category ON signals(category);
CREATE INDEX IF NOT EXISTS idx_signals_location ON signals USING GIST(location);

-- Function to automatically update location from lat/lng
CREATE OR REPLACE FUNCTION update_signal_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update location before insert/update
DROP TRIGGER IF EXISTS trigger_update_signal_location ON signals;
CREATE TRIGGER trigger_update_signal_location
  BEFORE INSERT OR UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_location();

-- Function to automatically determine ward from location
CREATE OR REPLACE FUNCTION update_signal_ward()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.location IS NOT NULL THEN
    SELECT id INTO NEW.ward_id
    FROM wards
    WHERE ST_Contains(geom, NEW.location)
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ward before insert/update
DROP TRIGGER IF EXISTS trigger_update_signal_ward ON signals;
CREATE TRIGGER trigger_update_signal_ward
  BEFORE INSERT OR UPDATE ON signals
  FOR EACH ROW
  EXECUTE FUNCTION update_signal_ward();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_wards_updated_at BEFORE UPDATE ON wards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON signals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
