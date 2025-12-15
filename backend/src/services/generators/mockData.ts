import { v4 as uuidv4 } from 'uuid';
import { analyzeSentiment } from '../processing/sentiment';

interface MockSignal {
  id: string;
  source_id: number;
  source_type: string;
  timestamp: Date;
  title?: string;
  body: string;
  author: string;
  sentiment: string;
  sentiment_score: number;
  keywords: string[];
  ward_id: number;
}

const TEMPLATES = [
  "Metro Red Line experiencing major delays between Fort Totten and Takoma. Avoid if possible!",
  "Amazing community cleanup event in Ward {ward} today! So proud of our neighborhood.",
  "Construction noise on Georgia Avenue is getting unbearable. Can't work from home anymore.",
  "New Ethiopian restaurant opening in Columbia Heights next week. Can't wait!",
  "Concerned about recent break-ins near {location}. Stay vigilant everyone.",
  "The new bike lanes on 14th Street are fantastic! Great job DDOT!",
  "Anyone else stuck in this traffic on Constitution Ave? What's going on?",
  "Free food distribution at the community center today 2-5pm. Pass it on!",
  "Pothole on Rhode Island Ave has been there for months. When will it get fixed?",
  "Beautiful day in DC! Perfect weather for a walk around the monuments.",
];

const LOCATIONS = [
  "Columbia Heights", "Adams Morgan", "Capitol Hill", "Dupont Circle",
  "Shaw", "H Street", "Georgetown", "Petworth"
];

const AUTHORS = [
  "u/dc_resident", "u/capitalcitizen", "@DCLocal", "@WardResident",
  "u/metrocommuter", "@NeighborhoodWatch", "u/districtdweller"
];

export function generateMockSignal(): MockSignal {
  // Pick random template
  const template = TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];

  // Fill in placeholders
  const ward = Math.floor(Math.random() * 8) + 1;
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const body = template
    .replace('{ward}', ward.toString())
    .replace('{location}', location);

  // Analyze sentiment
  const { sentiment, score } = analyzeSentiment(body);

  // Random timestamp in last 24 hours
  const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

  // Extract keywords
  const keywords = body.toLowerCase().split(' ')
    .filter(w => w.length > 4)
    .slice(0, 5);

  return {
    id: uuidv4(),
    source_id: 1,
    source_type: 'reddit',
    timestamp,
    body,
    author: AUTHORS[Math.floor(Math.random() * AUTHORS.length)],
    sentiment,
    sentiment_score: score,
    keywords,
    ward_id: ward,
  };
}

export function generateMockSignals(count: number): MockSignal[] {
  return Array.from({ length: count }, () => generateMockSignal());
}
