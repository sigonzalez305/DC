-- Seed data for Sources table
-- Insert DC government, ANC, and transportation data sources

-- DC Government Official Sources
INSERT INTO sources (slug, name, source_type, platform, handle, url, format, refresh_rate_minutes, is_active, wards, categories) VALUES

-- Executive Office of the Mayor
('mayor_newsroom', 'Mayor''s Office Newsroom', 'GOV_RSS', 'rss', NULL, 'https://mayor.dc.gov/newsroom.xml', 'rss', 30, true, ARRAY[]::integer[], ARRAY['policy', 'announcements']),

-- DC Government Main RSS
('dc_gov_news', 'DC.gov News Feed', 'GOV_RSS', 'rss', NULL, 'https://dc.gov/feeds/newsroom.xml', 'rss', 30, true, ARRAY[]::integer[], ARRAY['government', 'announcements']),

-- Official Social Media Accounts (Twitter/X)
('mayor_social', 'Executive Office of the Mayor (Social)', 'OFFICIAL_SOCIAL', 'twitter', '@MayorBowser', NULL, 'json', 5, true, ARRAY[]::integer[], ARRAY['policy', 'announcements']),

('comm_affairs', 'Mayor''s Office of Community Affairs', 'OFFICIAL_SOCIAL', 'twitter', '@CommAffDC', NULL, 'json', 15, true, ARRAY[]::integer[], ARRAY['community', 'events']),

('dc_mocrs', 'Community Relations & Services', 'OFFICIAL_SOCIAL', 'twitter', '@DCMOCRS', NULL, 'json', 15, true, ARRAY[]::integer[], ARRAY['community', 'services']),

('dc_police', 'Metropolitan Police Department', 'OFFICIAL_SOCIAL', 'twitter', '@DCPoliceDept', NULL, 'json', 5, true, ARRAY[]::integer[], ARRAY['safety', 'crime']),

('ddot', 'DC Department of Transportation', 'OFFICIAL_SOCIAL', 'twitter', '@ddotdc', NULL, 'json', 10, true, ARRAY[]::integer[], ARRAY['transportation', 'infrastructure']),

('dc_dpw', 'Department of Public Works', 'OFFICIAL_SOCIAL', 'twitter', '@DCDPW', NULL, 'json', 15, true, ARRAY[]::integer[], ARRAY['sanitation', 'services']),

('dc_octo', 'Office of the Chief Technology Officer', 'OFFICIAL_SOCIAL', 'twitter', '@octodc', NULL, 'json', 30, true, ARRAY[]::integer[], ARRAY['technology', 'services']),

-- WMATA (Metro) Transportation Sources
('metrorail_info', 'WMATA Metrorail Info', 'METRO_SOCIAL', 'twitter', '@metrorailinfo', NULL, 'json', 2, true, ARRAY[]::integer[], ARRAY['transportation', 'alerts']),

('metrobus_info', 'WMATA Metrobus Info', 'METRO_SOCIAL', 'twitter', '@metrobusinfo', NULL, 'json', 2, true, ARRAY[]::integer[], ARRAY['transportation', 'alerts']),

('wmata_official', 'WMATA Official', 'METRO_SOCIAL', 'twitter', '@wmata', NULL, 'json', 5, true, ARRAY[]::integer[], ARRAY['transportation', 'news']),

-- Advisory Neighborhood Commissions (Examples - add more as needed)
('oanc_calendar', 'Office of ANCs Meeting Calendar', 'OANC_CALENDAR', 'ical', NULL, 'https://anc.dc.gov/calendar', 'ics', 1440, true, ARRAY[]::integer[], ARRAY['civic', 'meetings']),

-- Ward-specific ANC examples
('anc_1a', 'ANC 1A', 'ANC_SITE', 'rss', NULL, 'https://anc1a.org/feed', 'rss', 1440, true, ARRAY[1], ARRAY['civic', 'meetings', 'ward1']),

('anc_2e', 'ANC 2E (Georgetown)', 'ANC_SITE', 'rss', NULL, 'https://anc2e.com/feed', 'rss', 1440, true, ARRAY[2], ARRAY['civic', 'meetings', 'ward2']),

('anc_6b', 'ANC 6B (Capitol Hill)', 'ANC_SITE', 'rss', NULL, 'https://anc6b.org/feed', 'rss', 1440, true, ARRAY[6], ARRAY['civic', 'meetings', 'ward6']),

-- Community Sources
('reddit_dc', 'r/washingtondc Subreddit', 'REDDIT', 'reddit', 'r/washingtondc', NULL, 'json', 10, true, ARRAY[]::integer[], ARRAY['community', 'discussion']),

-- Councilmember Accounts (Examples)
('cm_pinto', 'Councilmember Brooke Pinto (Ward 2)', 'OFFICIAL_SOCIAL', 'twitter', '@BrookePintodc', NULL, 'json', 30, true, ARRAY[2], ARRAY['policy', 'ward2']),

('cm_allen', 'Councilmember Charles Allen (Ward 6)', 'OFFICIAL_SOCIAL', 'twitter', '@charlesallen', NULL, 'json', 30, true, ARRAY[6], ARRAY['policy', 'ward6']),

('cm_trayon', 'Councilmember Trayon White (Ward 8)', 'OFFICIAL_SOCIAL', 'twitter', '@trayonwhite', NULL, 'json', 30, true, ARRAY[8], ARRAY['policy', 'ward8']);

-- Additional DC Agency Social Accounts
INSERT INTO sources (slug, name, source_type, platform, handle, url, format, refresh_rate_minutes, is_active, wards, categories) VALUES

('dc_fire_ems', 'DC Fire and EMS', 'OFFICIAL_SOCIAL', 'twitter', '@dcfireems', NULL, 'json', 5, true, ARRAY[]::integer[], ARRAY['emergency', 'safety']),

('dc_homeland', 'DC Homeland Security', 'OFFICIAL_SOCIAL', 'twitter', '@DC_HSEMA', NULL, 'json', 10, true, ARRAY[]::integer[], ARRAY['emergency', 'safety']),

('dc_housing', 'DC Housing Authority', 'OFFICIAL_SOCIAL', 'twitter', '@DCHA', NULL, 'json', 60, true, ARRAY[]::integer[], ARRAY['housing', 'services']),

('dc_parks', 'DC Parks and Recreation', 'OFFICIAL_SOCIAL', 'twitter', '@DPRontheGO', NULL, 'json', 30, true, ARRAY[]::integer[], ARRAY['parks', 'recreation']),

('dc_library', 'DC Public Library', 'OFFICIAL_SOCIAL', 'twitter', '@DCPublicLibrary', NULL, 'json', 60, true, ARRAY[]::integer[], ARRAY['education', 'events']),

('dc_schools', 'DC Public Schools', 'OFFICIAL_SOCIAL', 'twitter', '@dcpublicschools', NULL, 'json', 60, true, ARRAY[]::integer[], ARRAY['education', 'schools']),

('dc_health', 'DC Health', 'OFFICIAL_SOCIAL', 'twitter', '@_DCHealth', NULL, 'json', 60, true, ARRAY[]::integer[], ARRAY['health', 'services']);

-- Update timestamp for all sources
UPDATE sources SET updated_at = NOW();
