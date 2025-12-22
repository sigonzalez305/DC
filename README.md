# DC Community Pulse

Real-time community intelligence dashboard for Washington, DC. Monitors social media, government posts, and community discussions to analyze sentiment across DC's 8 wards.

## Project Structure

```
dc-community-pulse/
├── frontend/                # React + Vite + TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components (Map, Header, Analytics)
│   │   └── services/        # API client
│   └── package.json
├── backend/                 # Express + TypeScript API server
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── collectors/      # Data collection system
│   │   ├── db/              # Database configuration
│   │   └── services/        # Business logic
│   └── package.json
├── schema.sql               # PostgreSQL database schema
├── seed_sources.sql         # 25+ DC data sources
└── README.md
```

## Quick Start

### 1. Database Setup

```bash
# Install PostgreSQL with PostGIS
brew install postgresql postgis  # macOS
# or
sudo apt-get install postgresql postgresql-contrib postgis  # Ubuntu

# Create database
createdb dc_community_pulse

# Run schema and seed data
psql -U postgres -d dc_community_pulse -f schema.sql
psql -U postgres -d dc_community_pulse -f seed_sources.sql
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Edit with your database credentials

# Start API server
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env  # Set VITE_API_URL=http://localhost:3000

# Start frontend
npm run dev
```

## Backend API

The backend runs on port 3000 and provides these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/signals` | GET | Get all signals (with filters) |
| `/api/signals/:id` | GET | Get single signal |
| `/api/wards` | GET | List all DC wards |
| `/api/sources` | GET | List data sources |
| `/api/sentiment/citywide` | GET | Citywide sentiment analysis |
| `/api/keywords` | GET | Keyword/topic extraction |
| `/api/collector/status` | GET | Scheduler status |
| `/api/collector/stats` | GET | Collection statistics |
| `/api/collector/run/:slug` | POST | Run collector for source |
| `/api/collector/run-all` | POST | Run all collectors once |
| `/api/collector/scheduler/start` | POST | Start automated scheduler |
| `/api/collector/scheduler/stop` | POST | Stop scheduler |

## Data Collection

### NPM Scripts

```bash
# Run collector for a specific source
npm run collector:run mayor_newsroom

# Run test collector
npm run collector:test

# Start automated scheduler
npm run scheduler:start

# View collection statistics
npm run scheduler:stats

# Run all collectors once
npm run scheduler:once
```

### Signal Classification

Signals are automatically categorized:

- **RED** (Danger): crime, shooting, fire, emergency, accident
- **YELLOW** (Alert): warning, closure, delay, disruption
- **BLUE** (Sales): for sale, free, giveaway, discount
- **PINK** (Missed Connections): lost, found, looking for
- **GREEN** (Positive): everything else

## Core Components

### Database Schema (`schema.sql`)
- PostgreSQL with PostGIS for geographic queries
- 4 core tables: Wards, Sources, Signals, Events
- Neighborhood lookup for text-based geocoding
- Spatial indexes for fast ward assignment

### Collectors (`backend/src/collectors/`)
- **BaseCollector**: Parent class with normalization, classification, geocoding
- **RSSCollector**: Fetches and parses RSS feeds
- **Scheduler**: Automated collection on configurable intervals

### Source Registry (`seed_sources.sql`)
- 25+ DC data sources configured
- Mayor, Police, DDOT, Metro, ANCs
- Social media handles documented
- Refresh rates configured

## Data Flow

```
RSS Feed → Parse → Normalize → Classify → Geocode → Store → Database → API → Frontend
```

### Geocoding

The system extracts DC neighborhood mentions from text:
- "shooting in Columbia Heights" → Ward 1
- "Georgetown traffic alert" → Ward 2
- "Capitol Hill event" → Ward 6

## Environment Variables

### Backend (`backend/.env`)

```bash
PORT=3000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dc_community_pulse
DB_USER=postgres
DB_PASSWORD=postgres

# Reddit API (optional)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

### Frontend (`frontend/.env`)

```bash
VITE_API_URL=http://localhost:3000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## Database Queries

```sql
-- Get all signals from Ward 6
SELECT * FROM signals WHERE ward_id = 6;

-- Count signals by category
SELECT category, COUNT(*) FROM signals GROUP BY category;

-- Get RED signals from last 24 hours
SELECT * FROM signals
WHERE category = 'red'
AND timestamp > NOW() - INTERVAL '24 hours'
ORDER BY timestamp DESC;

-- Get signals mentioning a neighborhood
SELECT * FROM signals WHERE place_text = 'Columbia Heights';
```

## Adding New Data Sources

1. Add to `seed_sources.sql`:
```sql
INSERT INTO sources (slug, name, source_type, platform, url, refresh_rate_minutes, is_active)
VALUES ('new_feed', 'New DC Feed', 'GOV_RSS', 'rss', 'https://example.com/feed', 15, true);
```

2. Run seed script:
```bash
psql -U postgres -d dc_community_pulse -f seed_sources.sql
```

3. Collect via API or CLI:
```bash
# Via CLI
cd backend && npm run collector:run new_feed

# Via API
curl -X POST http://localhost:3000/api/collector/run/new_feed
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| Database does not exist | `createdb dc_community_pulse` |
| PostGIS not available | `brew install postgis` (macOS) or `apt install postgis` (Linux) |
| Cannot find module 'pg' | `cd backend && npm install` |
| No items in feed | Check RSS URL is accessible in browser |

## Architecture

- **PostgreSQL + PostGIS**: Native geographic queries, full-text search
- **Express + TypeScript**: Type-safe API with async/await
- **React + Vite**: Fast frontend with hot reload
- **Collector pattern**: Extensible data collection framework

## License

MIT
