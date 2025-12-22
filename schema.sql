-- DC Community Pulse - Database Schema
-- PostgreSQL with PostGIS extension

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Wards table - DC's 8 geographic wards
CREATE TABLE wards (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    ward_number INTEGER NOT NULL UNIQUE,
    geom GEOMETRY(Polygon, 4326) NOT NULL,
    centroid GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_wards_geom ON wards USING GIST(geom);
CREATE INDEX idx_wards_centroid ON wards USING GIST(centroid);

-- Sources table - Registry of all data sources
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- ANC_SITE, OANC_CALENDAR, GOV_RSS, OFFICIAL_SOCIAL, METRO_SOCIAL, REDDIT, EMAIL_LIST
    platform TEXT NOT NULL, -- rss, ical, twitter, reddit, email, json
    handle TEXT, -- Social media handle (e.g., @MayorBowser)
    url TEXT, -- Feed URL or API endpoint
    format TEXT, -- html, rss, pdf, ics, json
    refresh_rate_minutes INTEGER DEFAULT 15,
    is_active BOOLEAN DEFAULT TRUE,
    wards INTEGER[], -- Array of ward IDs if ward-specific
    categories TEXT[], -- e.g., ['safety', 'transportation']
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sources_slug ON sources(slug);
CREATE INDEX idx_sources_type ON sources(source_type);
CREATE INDEX idx_sources_active ON sources(is_active);
CREATE INDEX idx_sources_wards ON sources USING GIN(wards);

-- Signals table - Individual data points from all sources
CREATE TABLE signals (
    id BIGSERIAL PRIMARY KEY,
    source_id INTEGER NOT NULL REFERENCES sources(id),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT,
    body TEXT,
    author TEXT,
    platform TEXT,
    tags TEXT[],
    location GEOMETRY(Point, 4326),
    place_text TEXT,
    ward_id INTEGER REFERENCES wards(id),
    event_id INTEGER, -- Will reference events table
    category TEXT, -- green, yellow, red, blue, pink
    sentiment TEXT, -- positive, neutral, negative
    emotions JSONB,
    themes JSONB,
    ingested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    external_id TEXT, -- Original ID from source platform
    external_url TEXT -- Link back to original post
);

CREATE INDEX idx_signals_timestamp ON signals(timestamp);
CREATE INDEX idx_signals_source ON signals(source_id);
CREATE INDEX idx_signals_ward ON signals(ward_id);
CREATE INDEX idx_signals_category ON signals(category);
CREATE INDEX idx_signals_sentiment ON signals(sentiment);
CREATE INDEX idx_signals_location ON signals USING GIST(location);
CREATE INDEX idx_signals_external_id ON signals(source_id, external_id);
CREATE INDEX idx_signals_fulltext ON signals USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(body, '')));

-- Events table - Recurring and one-time events
CREATE TABLE events (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location GEOMETRY(Point, 4326),
    location_text TEXT,
    ward_id INTEGER REFERENCES wards(id),
    recurrence_rule TEXT, -- iCalendar RRULE format
    source_links JSONB, -- Array of source URLs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_start ON events(start_time);
CREATE INDEX idx_events_end ON events(end_time);
CREATE INDEX idx_events_ward ON events(ward_id);
CREATE INDEX idx_events_location ON events USING GIST(location);

-- Neighborhood lookup table for geocoding
CREATE TABLE neighborhoods (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    aliases TEXT[], -- Alternative names
    ward_id INTEGER NOT NULL REFERENCES wards(id),
    centroid GEOMETRY(Point, 4326) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_neighborhoods_name ON neighborhoods(name);
CREATE INDEX idx_neighborhoods_ward ON neighborhoods(ward_id);
CREATE INDEX idx_neighborhoods_centroid ON neighborhoods USING GIST(centroid);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sources table
CREATE TRIGGER update_sources_updated_at
    BEFORE UPDATE ON sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for events table
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for DC wards (placeholder - will be replaced with actual GeoJSON data)
INSERT INTO wards (name, ward_number, geom, centroid) VALUES
    ('Ward 1', 1, ST_GeomFromText('POLYGON((-77.04 38.93, -77.04 38.96, -77.01 38.96, -77.01 38.93, -77.04 38.93))', 4326), ST_GeomFromText('POINT(-77.025 38.945)', 4326)),
    ('Ward 2', 2, ST_GeomFromText('POLYGON((-77.08 38.90, -77.08 38.93, -77.04 38.93, -77.04 38.90, -77.08 38.90))', 4326), ST_GeomFromText('POINT(-77.06 38.915)', 4326)),
    ('Ward 3', 3, ST_GeomFromText('POLYGON((-77.12 38.93, -77.12 38.98, -77.05 38.98, -77.05 38.93, -77.12 38.93))', 4326), ST_GeomFromText('POINT(-77.085 38.955)', 4326)),
    ('Ward 4', 4, ST_GeomFromText('POLYGON((-77.04 38.96, -77.04 39.00, -76.98 39.00, -76.98 38.96, -77.04 38.96))', 4326), ST_GeomFromText('POINT(-77.01 38.98)', 4326)),
    ('Ward 5', 5, ST_GeomFromText('POLYGON((-77.01 38.93, -77.01 38.96, -76.96 38.96, -76.96 38.93, -77.01 38.93))', 4326), ST_GeomFromText('POINT(-76.985 38.945)', 4326)),
    ('Ward 6', 6, ST_GeomFromText('POLYGON((-77.04 38.87, -77.04 38.90, -76.98 38.90, -76.98 38.87, -77.04 38.87))', 4326), ST_GeomFromText('POINT(-77.01 38.885)', 4326)),
    ('Ward 7', 7, ST_GeomFromText('POLYGON((-77.01 38.87, -77.01 38.90, -76.96 38.90, -76.96 38.87, -77.01 38.87))', 4326), ST_GeomFromText('POINT(-76.985 38.885)', 4326)),
    ('Ward 8', 8, ST_GeomFromText('POLYGON((-77.04 38.82, -77.04 38.87, -76.96 38.87, -76.96 38.82, -77.04 38.82))', 4326), ST_GeomFromText('POINT(-77.00 38.845)', 4326));

-- Insert common DC neighborhoods
INSERT INTO neighborhoods (name, aliases, ward_id, centroid) VALUES
    ('Adams Morgan', ARRAY['Adams-Morgan'], 1, ST_GeomFromText('POINT(-77.0431 38.9220)', 4326)),
    ('Columbia Heights', ARRAY[], 1, ST_GeomFromText('POINT(-77.0323 38.9289)', 4326)),
    ('Shaw', ARRAY['Shaw/U Street'], 1, ST_GeomFromText('POINT(-77.0222 38.9157)', 4326)),
    ('Dupont Circle', ARRAY['Dupont'], 2, ST_GeomFromText('POINT(-77.0434 38.9097)', 4326)),
    ('Georgetown', ARRAY[], 2, ST_GeomFromText('POINT(-77.0636 38.9076)', 4326)),
    ('Foggy Bottom', ARRAY[], 2, ST_GeomFromText('POINT(-77.0505 38.8995)', 4326)),
    ('Cleveland Park', ARRAY[], 3, ST_GeomFromText('POINT(-77.0551 38.9338)', 4326)),
    ('Tenleytown', ARRAY[], 3, ST_GeomFromText('POINT(-77.0793 38.9495)', 4326)),
    ('Friendship Heights', ARRAY[], 3, ST_GeomFromText('POINT(-77.0866 38.9598)', 4326)),
    ('Petworth', ARRAY[], 4, ST_GeomFromText('POINT(-77.0309 38.9367)', 4326)),
    ('Brightwood', ARRAY[], 4, ST_GeomFromText('POINT(-77.0269 38.9579)', 4326)),
    ('Brookland', ARRAY[], 5, ST_GeomFromText('POINT(-76.9944 38.9343)', 4326)),
    ('Trinidad', ARRAY[], 5, ST_GeomFromText('POINT(-76.9828 38.9139)', 4326)),
    ('Capitol Hill', ARRAY['The Hill'], 6, ST_GeomFromText('POINT(-76.9907 38.8893)', 4326)),
    ('Navy Yard', ARRAY[], 6, ST_GeomFromText('POINT(-76.9958 38.8764)', 4326)),
    ('H Street Corridor', ARRAY['H Street', 'Atlas District'], 6, ST_GeomFromText('POINT(-76.9888 38.9001)', 4326)),
    ('Anacostia', ARRAY[], 8, ST_GeomFromText('POINT(-76.9883 38.8623)', 4326)),
    ('Congress Heights', ARRAY[], 8, ST_GeomFromText('POINT(-77.0072 38.8454)', 4326));

COMMENT ON TABLE wards IS 'DC geographic wards with boundary polygons';
COMMENT ON TABLE sources IS 'Registry of all data sources (RSS feeds, APIs, social media accounts)';
COMMENT ON TABLE signals IS 'Individual data points collected from all sources';
COMMENT ON TABLE events IS 'Calendar events (ANC meetings, government events, etc.)';
COMMENT ON TABLE neighborhoods IS 'DC neighborhoods for text-based geocoding';
