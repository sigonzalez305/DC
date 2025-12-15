import { analyzeCombinedSentiment } from '../utils/sentiment';

// Realistic DC-related topics and messages
const dcTopics = [
  {
    category: 'metro',
    templates: [
      { title: 'Red Line delays again', body: 'Single tracking between NoMa and Union Station. Adding 20+ minutes to my commute.' },
      { title: 'Metro service alert', body: 'Silver Line running smoothly this morning! Pleasantly surprised.' },
      { title: 'Green Line issues', body: 'Train broke down at Gallery Place. Everyone had to get off.' },
      { title: 'Metro improvement', body: 'New trains on the Blue Line are much quieter and cleaner. Love it!' },
      { title: 'Weekend track work', body: 'Orange Line shuttle buses this weekend. Plan ahead folks.' },
    ],
  },
  {
    category: 'safety',
    templates: [
      { title: 'Neighborhood watch update', body: 'Thanks to everyone who came to the community meeting. Our block is getting safer!' },
      { title: 'Car break-in alert', body: 'Multiple cars broken into on my street last night. Lock your doors!' },
      { title: 'Better lighting needed', body: 'The park is too dark at night. Can we get more street lights?' },
      { title: 'Police presence', body: 'Noticed increased police patrols in the area. Feeling safer.' },
      { title: 'Safety concern', body: 'Witnessed a mugging near the metro station. Be careful at night.' },
    ],
  },
  {
    category: 'events',
    templates: [
      { title: 'Cherry Blossom Festival', body: 'The blossoms are gorgeous this year! Tidal Basin is packed but worth it.' },
      { title: 'Smithsonian museum', body: 'Just visited the new exhibit at the Natural History Museum. Highly recommend!' },
      { title: 'Food truck festival', body: 'Food truck festival at the Wharf this weekend. So many great options!' },
      { title: 'Concert in the park', body: 'Free outdoor concert tonight at Meridian Hill Park. Great community vibe!' },
      { title: 'Farmers market', body: 'Dupont Circle farmers market has the best produce. Support local!' },
    ],
  },
  {
    category: 'housing',
    templates: [
      { title: 'Rent increase notice', body: 'Landlord raising rent by $400/month. This is getting ridiculous.' },
      { title: 'Apartment hunting', body: 'Been searching for 3 months. Everything is either too expensive or too small.' },
      { title: 'New development', body: 'Construction noise from the new apartment building is unbearable.' },
      { title: 'Great landlord', body: 'Just want to say my landlord is amazing and fixed everything quickly!' },
      { title: 'Housing lottery', body: 'Won the affordable housing lottery! Moving to a new place next month.' },
    ],
  },
  {
    category: 'traffic',
    templates: [
      { title: 'Beltway traffic', body: 'I-495 is a parking lot right now. Avoid if possible.' },
      { title: 'Bike lane improvements', body: 'New protected bike lanes on 15th St are fantastic! Feel much safer.' },
      { title: 'Pothole report', body: 'Huge pothole on Connecticut Ave near Dupont. Almost wrecked my car.' },
      { title: 'Street closure', body: 'Pennsylvania Ave closed for presidential motorcade. Traffic is backed up for miles.' },
      { title: 'Parking nightmare', body: 'Spent 30 minutes looking for parking in Georgetown. Finally gave up and paid for a garage.' },
    ],
  },
  {
    category: 'community',
    templates: [
      { title: 'Neighborhood cleanup', body: 'Join us this Saturday for a community cleanup! Free breakfast provided.' },
      { title: 'New restaurant opening', body: 'Awesome new Ethiopian restaurant just opened in Columbia Heights!' },
      { title: 'Library closure', body: 'My local library is closing for renovations. Where am I supposed to study now?' },
      { title: 'Community garden', body: 'Our community garden is thriving! We have tomatoes, peppers, and herbs.' },
      { title: 'Dog park love', body: 'The new dog park is amazing. My pup has made so many friends!' },
    ],
  },
];

const authors = [
  'DCResident2024',
  'WardWatcher',
  'CapitolHillLocal',
  'AdamsMorganLife',
  'GeorgetownNative',
  'DupontCircler',
  'ShawNeighbor',
  'AnacostiaStrong',
  'PetWorthResident',
  'ColumbiaHeights202',
  'NavyYardLocal',
  'ClevelandParkDad',
  'TakomaParkMom',
  'FoggyBottomStudent',
  'BarracksRowLife',
];

interface MockSignalInput {
  source_id: number;
  title: string | null;
  body: string;
  category: string;
  ward_id: number;
  latitude?: number;
  longitude?: number;
}

interface MockSignal extends MockSignalInput {
  source_type: string;
  timestamp: Date;
  author: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  keywords: string[];
}

/**
 * Generate a random timestamp within the last 24 hours
 */
function randomTimestamp(): Date {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const randomTime = twentyFourHoursAgo.getTime() + Math.random() * (now.getTime() - twentyFourHoursAgo.getTime());
  return new Date(randomTime);
}

/**
 * Get random DC ward coordinates
 * These are approximate center points for each ward
 */
function getWardCoordinates(wardId: number): { latitude: number; longitude: number } {
  const wardCoords: Record<number, { latitude: number; longitude: number }> = {
    1: { latitude: 38.9149, longitude: -77.0065 },
    2: { latitude: 38.9205, longitude: -77.0465 },
    3: { latitude: 38.9355, longitude: -77.0695 },
    4: { latitude: 38.9555, longitude: -77.0255 },
    5: { latitude: 38.9155, longitude: -76.9855 },
    6: { latitude: 38.8955, longitude: -76.9955 },
    7: { latitude: 38.8755, longitude: -76.9755 },
    8: { latitude: 38.8555, longitude: -76.9855 },
  };

  return wardCoords[wardId] || wardCoords[1];
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'was', 'are', 'were', 'been', 'be',
    'this', 'that', 'these', 'those', 'my', 'your', 'our', 'their',
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));

  // Get unique words and return top 5 by frequency
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Generate a single mock signal
 */
export function generateMockSignal(sourceId: number): MockSignal {
  // Pick a random topic
  const topic = dcTopics[Math.floor(Math.random() * dcTopics.length)];
  const template = topic.templates[Math.floor(Math.random() * topic.templates.length)];

  // Random ward (1-8)
  const wardId = Math.floor(Math.random() * 8) + 1;
  const coords = getWardCoordinates(wardId);

  // Add slight randomness to coordinates (within ~0.01 degrees)
  const latitude = coords.latitude + (Math.random() - 0.5) * 0.02;
  const longitude = coords.longitude + (Math.random() - 0.5) * 0.02;

  // Random author
  const author = authors[Math.floor(Math.random() * authors.length)];

  // Generate sentiment
  const sentimentResult = analyzeCombinedSentiment(template.title, template.body);

  // Extract keywords
  const keywords = extractKeywords(`${template.title} ${template.body}`);

  // Random timestamp in last 24 hours
  const timestamp = randomTimestamp();

  return {
    source_id: sourceId,
    source_type: 'reddit',
    timestamp,
    title: template.title,
    body: template.body,
    author,
    url: `https://reddit.com/r/washingtondc/comments/mock${Date.now()}`,
    sentiment: sentimentResult.sentiment,
    sentiment_score: sentimentResult.score,
    latitude,
    longitude,
    ward_id: wardId,
    keywords,
    category: topic.category,
  };
}

/**
 * Generate multiple mock signals
 */
export function generateMockSignals(count: number, sourceId: number): MockSignal[] {
  const signals: MockSignal[] = [];

  for (let i = 0; i < count; i++) {
    signals.push(generateMockSignal(sourceId));
  }

  // Sort by timestamp (newest first)
  signals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return signals;
}
