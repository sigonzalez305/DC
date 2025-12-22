# DC Community Pulse - Data Collection System

Real-time community intelligence dashboard for Washington, DC. Monitors social media, government posts, and community discussions to analyze sentiment across DC's 8 wards.

## What You Just Built

This is **Step 1** of your DC Community Pulse app: **The Core Data Pipeline**

### Components Created

1. **Database Schema** (`schema.sql`)
   - PostgreSQL with PostGIS for geographic queries
   - 4 core tables: Wards, Sources, Signals, Events
   - Neighborhood lookup for text-based geocoding
   - Spatial indexes for fast ward assignment

2. **BaseCollector Class** (`BaseCollector.js`)
   - Parent class for all data collectors
   - Normalization pipeline
   - Keyword-based classification (Red/Yellow/Blue/Pink/Green)
   - Basic sentiment analysis
   - Neighborhood extraction and geocoding
   - Duplicate detection

3. **RSS Collector** (`RSSCollector.js`)
   - Fetches and parses RSS feeds
   - Processes Mayor's office newsroom
   - Can handle any DC government RSS feed

4. **Source Registry** (`seed_sources.sql`)
   - 25+ DC data sources configured
   - Mayor, Police, DDOT, Metro, ANCs
   - Social media handles documented
   - Refresh rates configured

## Setup Instructions

### 1. Install PostgreSQL with PostGIS

```bash
# macOS
brew install postgresql postgis

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib postgis

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux
```

### 2. Create Database

```bash
# Create the database
createdb dc_community_pulse

# Or using psql
psql -U postgres
CREATE DATABASE dc_community_pulse;
\q
```

### 3. Run Database Schema

```bash
psql -U postgres -d dc_community_pulse -f schema.sql
```

This creates all tables and loads placeholder ward boundaries and DC neighborhoods.

### 4. Seed Data Sources

```bash
psql -U postgres -d dc_community_pulse -f seed_sources.sql
```

This populates the `sources` table with 25+ DC data sources.

### 5. Install Node.js Dependencies

```bash
npm install
```

### 6. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 7. Test the Collector

```bash
npm test
```

This will:
- Connect to your database
- Fetch the Mayor's newsroom RSS feed
- Process and classify each article
- Store signals in the database
- Show you what was collected

## What the System Does

### Data Flow

```
RSS Feed → Parse → Normalize → Classify → Geocode → Store → Database
```

### Classification Rules

The system automatically categorizes every signal:

- **RED** (Danger): crime, shooting, fire, emergency, accident
- **YELLOW** (Alert): warning, closure, delay, disruption, maintenance
- **BLUE** (Sales): for sale, free, giveaway, discount, offer
- **PINK** (Missed Connections): lost, found, looking for, seeking
- **GREEN** (Positive): everything else

### Geocoding

The system extracts DC neighborhood mentions from text:
- "shooting in Columbia Heights" → Ward 1
- "Georgetown traffic alert" → Ward 2
- "Capitol Hill event" → Ward 6

### Sentiment Analysis

Basic positive/neutral/negative classification using keyword matching.

## Database Structure

### Signals Table
Every piece of data becomes a "signal":
```sql
id | source_id | timestamp | title | body | category | sentiment | ward_id
```

### Query Examples

```sql
-- Get all signals from Ward 6
SELECT * FROM signals WHERE ward_id = 6;

-- Count signals by category
SELECT category, COUNT(*) 
FROM signals 
GROUP BY category;

-- Get RED signals from last 24 hours
SELECT * FROM signals 
WHERE category = 'red' 
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Get signals mentioning a neighborhood
SELECT * FROM signals 
WHERE place_text = 'Columbia Heights';
```

## Next Steps

### Immediate (What You Can Do Now)

1. **Verify data collection works:**
   ```bash
   npm test
   ```

2. **Check the database:**
   ```bash
   psql -U postgres -d dc_community_pulse
   SELECT COUNT(*) FROM signals;
   SELECT * FROM signals LIMIT 5;
   ```

3. **Run manual collections:**
   ```bash
   node test_collector.js
   ```

### Phase 2: Expand Data Sources

Add more collectors:

- **Twitter/X Collector** for @MayorBowser, @DCPoliceDept, @metrorailinfo
- **Reddit Collector** for r/washingtondc
- **ANC Calendar Collector** for meeting schedules

### Phase 3: Improve Classification

- Replace keyword matching with machine learning (Hugging Face models)
- Add emotion detection
- Extract topics/themes using NLP

### Phase 4: Build API

Create REST endpoints:
- `GET /wards` - List all wards
- `GET /wards/:id/signals` - Get signals for a ward
- `GET /signals?category=red` - Filter by category
- `GET /signals/search?q=police` - Full-text search

### Phase 5: Build Frontend

Create the dashboard:
- Interactive DC map with ward boundaries
- Color-coded wards (based on latest signals)
- Signal feed with filters
- Sentiment charts

## Project Structure

```
dc-community-pulse/
├── schema.sql              # Database schema
├── seed_sources.sql        # Source registry data
├── BaseCollector.js        # Parent collector class
├── RSSCollector.js         # RSS feed collector
├── test_collector.js       # Test script
├── package.json            # Node dependencies
├── .env.example            # Environment template
└── README.md               # This file
```

## Configuration

### Adding New RSS Sources

1. Add to `seed_sources.sql`:
```sql
INSERT INTO sources (slug, name, source_type, platform, url, ...) VALUES
('new_feed', 'New DC Feed', 'GOV_RSS', 'rss', 'https://...', ...);
```

2. Run seed script:
```bash
psql -U postgres -d dc_community_pulse -f seed_sources.sql
```

3. Collect from new source:
```javascript
const collector = new RSSCollector();
await collector.collect('new_feed');
```

### Adjusting Classification Keywords

Edit `BaseCollector.js`, method `classifySignal()`:

```javascript
const redKeywords = [
  'crime', 'shooting', 'robbery', // Add more here
];
```

## Troubleshooting

### "Database does not exist"
```bash
createdb dc_community_pulse
```

### "PostGIS extension not available"
```bash
# Install PostGIS first
brew install postgis  # macOS
sudo apt-get install postgis  # Linux
```

### "No items found in feed"
The RSS feed might be temporarily unavailable or the URL changed. Check the source URL in the browser.

### "Cannot find module 'pg'"
```bash
npm install
```

## Architecture Notes

### Why PostgreSQL + PostGIS?
- Native geographic queries (point-in-polygon for ward assignment)
- Full-text search built-in
- JSON support for flexible metadata
- Industry standard for civic tech

### Why Node.js?
- Fast async I/O for data collection
- Large ecosystem of parsers (RSS, Twitter, Reddit)
- Easy to deploy
- JavaScript for both backend and frontend

### Design Principles
- **Collector pattern**: Each data source gets its own collector class
- **Normalization**: Convert all sources to common Signal format
- **Idempotency**: Re-running collectors doesn't create duplicates
- **Extensibility**: Easy to add new sources and processors

## Success Metrics

You'll know this step worked when:

✅ Database has 50+ signals from Mayor's newsroom  
✅ Signals are classified (red/yellow/blue/pink/green)  
✅ Some signals have ward assignments  
✅ You can query signals by category and ward  
✅ No duplicate signals when re-running collector  

## Questions?

This is a working data pipeline. You now have:
- A database collecting real DC government data
- Automatic classification and geocoding
- Foundation for sentiment analysis
- Ready to add more sources

**Your data is now flowing. Next step: Add more collectors or build the API.**
