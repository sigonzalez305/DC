# DC Community Pulse - Quick Setup Guide

This guide will help you get DC Community Pulse running on your local machine in minutes.

## Prerequisites

Before you begin, make sure you have:
- ✅ Node.js 18+ installed ([download](https://nodejs.org/))
- ✅ PostgreSQL 14+ installed ([download](https://www.postgresql.org/download/))
- ✅ Git installed

## Quick Start (5 Minutes)

### Step 1: Set Up Database (2 minutes)

```bash
# Create the database
createdb dc_community_pulse

# Enable PostGIS extension
psql dc_community_pulse -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Step 2: Set Up Backend (2 minutes)

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Run migrations to create tables
npm run migrate

# Seed the database with DC wards
npm run seed

# Start the backend server
npm run dev
```

Backend will be running at: **http://localhost:3000**

### Step 3: Set Up Frontend (1 minute)

Open a **new terminal window**:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start the frontend
npm run dev
```

Frontend will be running at: **http://localhost:5173**

### Step 4: View the Dashboard

Open your browser and go to: **http://localhost:5173**

You should see the DC Community Pulse dashboard!

## Initial State

At this point:
- ✅ Database is set up with DC's 8 wards
- ✅ API is running and accessible
- ✅ Frontend is connected to the API
- ✅ Dashboard displays (but with zero signals)

The dashboard will show **0 signals** initially because we haven't collected any data yet.

## Generate Mock Data for Testing (Recommended)

Before setting up the Reddit API, you can test the app with realistic mock data:

### Generate 50 Mock Signals

```bash
# In a new terminal (make sure backend is running)
curl -X POST http://localhost:3000/api/dev/generate-mock-data \
  -H "Content-Type: application/json" \
  -d '{"count": 50}'
```

This generates realistic DC-related signals about:
- 🚇 Metro (delays, improvements, issues)
- 🔒 Safety (community watch, concerns)
- 🎉 Events (festivals, museums, concerts)
- 🏠 Housing (rent, landlords, developments)
- 🚗 Traffic (beltway, bike lanes, potholes)
- 👥 Community (cleanup, restaurants, parks)

Each signal has:
- Mixed sentiment (positive, neutral, negative)
- Random ward assignment (1-8)
- Realistic timestamps (last 24 hours)
- Sentiment scores and keywords

### Refresh the Dashboard

Go to http://localhost:5173 - you should now see:
- Total signal count updated
- Sentiment breakdown (positive, neutral, negative)
- Signal list with color-coded borders
- Active filters working

### Clear and Regenerate Data

```bash
# Clear all signals
curl -X DELETE http://localhost:3000/api/dev/clear-signals

# Generate 100 new signals
curl -X POST http://localhost:3000/api/dev/generate-mock-data \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'
```

## Collecting Data from Reddit (Optional)

To populate the dashboard with real data from r/washingtondc:

### Step 1: Get Reddit API Credentials

1. Go to: https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Fill in:
   - **Name**: DC Community Pulse
   - **App type**: script
   - **Description**: Community sentiment analysis
   - **Redirect URI**: http://localhost:3000
4. Click "Create app"
5. Copy the **client ID** (below "personal use script") and **secret**

### Step 2: Add Credentials to Backend

Edit `backend/.env`:
```env
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_secret_here
```

### Step 3: Run the Collector

```bash
cd backend
ts-node src/collectors/reddit.ts
```

This will:
- Fetch the latest 25 posts from r/washingtondc
- Analyze their sentiment
- Categorize them
- Save them to the database

### Step 4: Refresh the Dashboard

Refresh http://localhost:5173 in your browser - you should now see real data!

## Troubleshooting

### "Database connection failed"
- Make sure PostgreSQL is running: `pg_isready`
- Check your database credentials in `backend/.env`
- Verify the database exists: `psql -l | grep dc_community_pulse`

### "Port 3000 already in use"
- Another app is using port 3000
- Change the port in `backend/.env`: `PORT=3001`
- Update `frontend/.env`: `VITE_API_URL=http://localhost:3001/api`

### "PostGIS extension error"
- Install PostGIS: `sudo apt-get install postgis` (Ubuntu/Debian)
- Or: `brew install postgis` (macOS)
- Then run: `psql dc_community_pulse -c "CREATE EXTENSION postgis;"`

### Frontend shows "Failed to fetch data"
- Make sure backend is running on port 3000
- Check console for errors (F12 in browser)
- Verify `VITE_API_URL` in `frontend/.env` is correct

### Reddit collector fails
- Double-check your Reddit credentials in `backend/.env`
- Make sure you created a "script" type app, not "web app"
- Wait a minute and try again (Reddit rate limiting)

## What's Next?

Now that everything is running:

1. **Explore the API**: Visit http://localhost:3000/api/health
2. **View API data**: Try http://localhost:3000/api/wards
3. **Collect more data**: Run the Reddit collector periodically
4. **Customize**: Edit the frontend in `frontend/src/components/`

## Common Commands

```bash
# Backend
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm run migrate      # Run database migrations
npm run seed         # Seed database with initial data

# Frontend
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Data Collection
cd backend
ts-node src/collectors/reddit.ts   # Fetch Reddit data
```

## Environment Variables Reference

### Backend (.env)
```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dc_community_pulse
DB_USER=postgres
DB_PASSWORD=postgres

# Optional: For Reddit data collection
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=DC Community Pulse v1.0.0
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
```

## Need More Help?

- 📖 See the full README.md for detailed documentation
- 🐛 Report issues on GitHub
- 💬 Check the API endpoints at http://localhost:3000

Happy coding! 🎉
