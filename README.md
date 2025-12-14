# DC Community Pulse

Real-time community intelligence dashboard for Washington, DC that monitors social media, government posts, and community discussions to analyze sentiment, detect themes, and identify geographic hotspots across DC's 8 wards.

## Project Structure

```
DC/
├── backend/          # Node.js + Express + TypeScript + PostgreSQL API
├── frontend/         # React + Vite + TypeScript + Tailwind CSS
└── README.md
```

## Features (Phase 1: Foundation)

- ✅ PostgreSQL database with PostGIS for geographic data
- ✅ RESTful API with Express and TypeScript
- ✅ Database schema for Wards, Sources, and Signals
- ✅ React frontend with Tailwind CSS
- ✅ Basic dashboard layout with map placeholder
- ✅ Sentiment tracking (positive/neutral/negative)
- ✅ Ward-based geographic organization
- ✅ Database migrations and seeding system
- ✅ Reddit data collector for r/washingtondc
- ✅ Automated sentiment analysis

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with PostGIS
- **ORM/Client**: node-postgres (pg)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks (useState, useEffect)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ with PostGIS extension
- Git

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd DC
```

### 2. Database Setup

Install PostgreSQL and PostGIS if you haven't already:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis

# macOS (using Homebrew)
brew install postgresql postgis
```

Create the database:

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE dc_community_pulse;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE dc_community_pulse TO postgres;

# Connect to the database
\c dc_community_pulse

# Enable PostGIS extension
CREATE EXTENSION postgis;

# Exit psql
\q
```

Run migrations and seeds:

```bash
cd backend

# Install dependencies first
npm install

# Run migrations to create tables
npm run migrate

# Run seeds to populate initial data (DC wards and Reddit source)
npm run seed
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# nano .env or use your preferred editor

# Run in development mode
npm run dev
```

The backend API will be available at `http://localhost:3000`

**Backend Environment Variables** (`.env`):
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dc_community_pulse
DB_USER=postgres
DB_PASSWORD=postgres

# Reddit API Configuration (optional - for data collection)
# Get credentials from: https://www.reddit.com/prefs/apps
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=DC Community Pulse v1.0.0
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run in development mode
npm run dev
```

The frontend will be available at `http://localhost:5173`

**Frontend Environment Variables** (`.env`):
```env
VITE_API_URL=http://localhost:3000/api
```

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Wards
- `GET /api/wards` - Get all DC wards
- `GET /api/wards/:id` - Get a specific ward

### Sources
- `GET /api/sources` - Get all sources (with optional filters: `type`, `is_active`)
- `GET /api/sources/:id` - Get a specific source

### Signals
- `GET /api/signals` - Get all signals (with optional filters: `ward_id`, `sentiment`, `category`, `limit`)
- `GET /api/signals/:id` - Get a specific signal

## Database Schema

### Wards Table
Stores information about DC's 8 wards with geographic boundaries.

```sql
- id: Serial primary key
- name: Ward name (e.g., "Ward 1")
- geom: PostGIS MULTIPOLYGON geometry
- population: Ward population
- created_at, updated_at: Timestamps
```

### Sources Table
Tracks social media accounts, government feeds, and other data sources.

```sql
- id: Serial primary key
- slug: Unique identifier
- name: Display name
- type: Source type (twitter, instagram, reddit, nextdoor, government, other)
- handle: Social media handle
- refresh_rate_minutes: How often to check
- last_fetched_at: Last fetch timestamp
- is_active: Whether source is active
- created_at, updated_at: Timestamps
```

### Signals Table
Individual posts/messages with sentiment analysis and location data.

```sql
- id: Serial primary key
- source_id: Reference to sources table
- source_type: Type of source
- timestamp: When the signal was posted
- title: Optional title
- body: Content text
- author: Author username/name
- url: Link to original post
- sentiment: positive/neutral/negative
- sentiment_score: -1 to 1 score
- latitude, longitude: Geographic coordinates
- location: PostGIS POINT geometry
- ward_id: Automatically determined from location
- keywords: Array of keywords
- category: Signal category
- created_at, updated_at: Timestamps
```

## Development Workflow

### Running Both Servers

In separate terminal windows:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Collecting Data from Reddit

To fetch posts from r/washingtondc:

```bash
cd backend

# Make sure you've set up Reddit API credentials in .env
# Then run the collector
ts-node src/collectors/reddit.ts
```

The collector will:
1. Fetch the latest posts from r/washingtondc
2. Analyze sentiment using the built-in sentiment analysis
3. Categorize posts (events, crime, transportation, housing, etc.)
4. Save signals to the database
5. Skip posts that have already been collected

### Database Management

```bash
cd backend

# Run migrations (creates tables)
npm run migrate

# Run seeds (populates initial data)
npm run seed

# Run Reddit collector manually
ts-node src/collectors/reddit.ts
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Next Steps (Future Phases)

### Phase 2: Data Collection
- ✅ Reddit API integration for r/washingtondc
- ⏳ Scheduled data fetching (cron jobs)
- ⏳ Twitter/X API integration
- ⏳ Set up data scraping for government sources
- ⏳ Nextdoor integration

### Phase 3: Analysis
- ✅ Sentiment analysis with NLP
- ✅ Basic categorization (events, crime, transportation, etc.)
- ⏳ Keyword extraction
- ⏳ Create topic clustering
- ⏳ Geographic hotspot detection

### Phase 4: Visualization
- Integrate Mapbox or Leaflet for interactive maps
- Add real-time data updates with WebSockets
- Create charts and graphs for trends
- Build alert system for emerging issues

### Phase 5: Intelligence
- Machine learning for trend prediction
- Anomaly detection
- Comparative ward analysis
- Historical trend analysis

## Project Status

**Current Phase**: Phase 2 - Data Collection 🚧

- [x] Project structure
- [x] Database schema with PostGIS
- [x] Backend API with TypeScript
- [x] Frontend with React and Tailwind
- [x] Basic dashboard layout
- [x] Database migrations and seeds
- [x] Reddit data collector
- [x] Sentiment analysis
- [ ] Scheduled data fetching
- [ ] Map integration
- [ ] Real-time updates

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Contact

For questions or feedback, please open an issue on GitHub.
