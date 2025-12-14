-- Insert DC's 8 wards with placeholder geometries
-- These are approximate center points for each ward
-- Real ward boundary geometries can be added later from DC Open Data

INSERT INTO wards (name, population, geom) VALUES
  ('Ward 1', 85000, ST_GeomFromText('MULTIPOLYGON(((-77.01 38.91, -77.01 38.92, -77.00 38.92, -77.00 38.91, -77.01 38.91)))', 4326)),
  ('Ward 2', 85000, ST_GeomFromText('MULTIPOLYGON(((-77.04 38.92, -77.04 38.93, -77.03 38.93, -77.03 38.92, -77.04 38.92)))', 4326)),
  ('Ward 3', 85000, ST_GeomFromText('MULTIPOLYGON(((-77.07 38.93, -77.07 38.94, -77.06 38.94, -77.06 38.93, -77.07 38.93)))', 4326)),
  ('Ward 4', 85000, ST_GeomFromText('MULTIPOLYGON(((-77.03 38.95, -77.03 38.96, -77.02 38.96, -77.02 38.95, -77.03 38.95)))', 4326)),
  ('Ward 5', 85000, ST_GeomFromText('MULTIPOLYGON(((-76.99 38.91, -76.99 38.92, -76.98 38.92, -76.98 38.91, -76.99 38.91)))', 4326)),
  ('Ward 6', 85000, ST_GeomFromText('MULTIPOLYGON(((-77.00 38.89, -77.00 38.90, -76.99 38.90, -76.99 38.89, -77.00 38.89)))', 4326)),
  ('Ward 7', 85000, ST_GeomFromText('MULTIPOLYGON(((-76.98 38.87, -76.98 38.88, -76.97 38.88, -76.97 38.87, -76.98 38.87)))', 4326)),
  ('Ward 8', 85000, ST_GeomFromText('MULTIPOLYGON(((-76.99 38.85, -76.99 38.86, -76.98 38.86, -76.98 38.85, -76.99 38.85)))', 4326))
ON CONFLICT (name) DO NOTHING;

-- Insert the r/washingtondc Reddit source
INSERT INTO sources (slug, name, type, handle, refresh_rate_minutes, is_active) VALUES
  ('reddit-washingtondc', 'r/washingtondc', 'reddit', 'washingtondc', 60, true)
ON CONFLICT (slug) DO NOTHING;
