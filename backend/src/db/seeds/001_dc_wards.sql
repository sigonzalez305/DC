-- DC's 8 wards are now inserted directly in the migration file
-- This seed file just adds the source data

-- Insert the r/washingtondc Reddit source
INSERT INTO sources (slug, name, type, handle, refresh_rate_minutes, is_active) VALUES
  ('reddit-washingtondc', 'r/washingtondc', 'reddit', 'washingtondc', 60, true)
ON CONFLICT (slug) DO NOTHING;
