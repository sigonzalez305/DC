// BaseCollector.js - Parent class for all data collectors
const { Pool } = require('pg');

class BaseCollector {
  constructor(config) {
    this.config = config;
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'dc_community_pulse',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
  }

  /**
   * Main collection method - override in child classes
   */
  async collect() {
    throw new Error('collect() must be implemented by child class');
  }

  /**
   * Get source configuration from database
   * @param {string} slug - Source slug identifier
   * @returns {Object} Source configuration
   */
  async getSource(slug) {
    const result = await this.pool.query(
      'SELECT * FROM sources WHERE slug = $1 AND is_active = true',
      [slug]
    );
    
    if (result.rows.length === 0) {
      throw new Error(`Source not found or inactive: ${slug}`);
    }
    
    return result.rows[0];
  }

  /**
   * Store a normalized signal in the database
   * @param {Object} signal - Normalized signal object
   * @returns {Object} Inserted signal with ID
   */
  async storeSignal(signal) {
    // Check if signal already exists (duplicate detection)
    if (signal.external_id) {
      const existing = await this.pool.query(
        'SELECT id FROM signals WHERE source_id = $1 AND external_id = $2',
        [signal.source_id, signal.external_id]
      );
      
      if (existing.rows.length > 0) {
        console.log(`Signal already exists: ${signal.external_id}`);
        return null;
      }
    }

    const query = `
      INSERT INTO signals (
        source_id, timestamp, title, body, author, platform,
        tags, place_text, category, sentiment, external_id, external_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      signal.source_id,
      signal.timestamp,
      signal.title,
      signal.body,
      signal.author,
      signal.platform,
      signal.tags || [],
      signal.place_text,
      signal.category,
      signal.sentiment,
      signal.external_id,
      signal.external_url
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Normalize raw data into signal format
   * @param {Object} rawData - Raw data from source
   * @param {Object} source - Source configuration
   * @returns {Object} Normalized signal
   */
  normalizeSignal(rawData, source) {
    return {
      source_id: source.id,
      timestamp: rawData.timestamp || new Date(),
      title: rawData.title || null,
      body: rawData.body || rawData.content || null,
      author: rawData.author || null,
      platform: source.platform,
      tags: rawData.tags || [],
      place_text: rawData.location || null,
      category: null, // Will be set by classifier
      sentiment: null, // Will be set by sentiment analyzer
      external_id: rawData.id || rawData.guid || null,
      external_url: rawData.url || rawData.link || null
    };
  }

  /**
   * Basic keyword-based classification
   * @param {string} title - Signal title
   * @param {string} body - Signal body
   * @returns {string} Category (red, yellow, blue, pink, green)
   */
  classifySignal(title, body) {
    const text = `${title || ''} ${body || ''}`.toLowerCase();

    // RED - Danger/Crime
    const redKeywords = [
      'crime', 'shooting', 'robbery', 'assault', 'murder', 'stabbing',
      'carjacking', 'fire', 'emergency', 'danger', 'weapon', 'injured',
      'accident', 'crash', 'collision'
    ];

    // YELLOW - Alerts/Caution
    const yellowKeywords = [
      'alert', 'warning', 'closed', 'closure', 'delay', 'disruption',
      'service', 'maintenance', 'construction', 'detour', 'heads up',
      'attention', 'notice', 'advisory', 'suspended'
    ];

    // BLUE - Sales/Free offers
    const blueKeywords = [
      'sale', 'for sale', 'selling', 'free', 'giveaway', 'discount',
      'offer', 'yard sale', 'garage sale', 'deals', 'bargain', 'promo'
    ];

    // PINK - Missed connections/Looking for
    const pinkKeywords = [
      'missed connection', 'looking for', 'seeking', 'lost', 'found',
      'anyone know', 'does anyone', 'help find'
    ];

    // Check in priority order
    for (const keyword of redKeywords) {
      if (text.includes(keyword)) return 'red';
    }

    for (const keyword of yellowKeywords) {
      if (text.includes(keyword)) return 'yellow';
    }

    for (const keyword of blueKeywords) {
      if (text.includes(keyword)) return 'blue';
    }

    for (const keyword of pinkKeywords) {
      if (text.includes(keyword)) return 'pink';
    }

    // Default to green (positive/neutral news)
    return 'green';
  }

  /**
   * Simple sentiment analysis
   * @param {string} text - Text to analyze
   * @returns {string} Sentiment (positive, neutral, negative)
   */
  analyzeSentiment(text) {
    const lowerText = text.toLowerCase();

    const positiveWords = ['great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'proud', 'celebrate', 'success', 'improved'];
    const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'concern', 'worried', 'problem', 'issue', 'complaint'];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });

    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Extract DC neighborhood mentions from text
   * @param {string} text - Text to search
   * @returns {string|null} Neighborhood name if found
   */
  extractNeighborhood(text) {
    const neighborhoods = [
      'Adams Morgan', 'Columbia Heights', 'Shaw', 'Dupont Circle',
      'Georgetown', 'Foggy Bottom', 'Cleveland Park', 'Tenleytown',
      'Friendship Heights', 'Petworth', 'Brightwood', 'Brookland',
      'Trinidad', 'Capitol Hill', 'Navy Yard', 'H Street', 'Anacostia',
      'Congress Heights', 'Logan Circle', 'Mount Pleasant', 'U Street',
      'Chinatown', 'Penn Quarter', 'NoMa', 'Eckington', 'Bloomingdale'
    ];

    const lowerText = text.toLowerCase();

    for (const neighborhood of neighborhoods) {
      if (lowerText.includes(neighborhood.toLowerCase())) {
        return neighborhood;
      }
    }

    return null;
  }

  /**
   * Geocode a signal to assign ward_id
   * @param {number} signalId - Signal ID to geocode
   */
  async geocodeSignal(signalId) {
    // Get signal
    const signalResult = await this.pool.query(
      'SELECT * FROM signals WHERE id = $1',
      [signalId]
    );

    if (signalResult.rows.length === 0) return;

    const signal = signalResult.rows[0];
    let wardId = null;

    // Try to find neighborhood in text
    const fullText = `${signal.title || ''} ${signal.body || ''}`;
    const neighborhood = this.extractNeighborhood(fullText);

    if (neighborhood) {
      // Look up ward from neighborhood
      const neighborhoodResult = await this.pool.query(
        'SELECT ward_id FROM neighborhoods WHERE LOWER(name) = LOWER($1)',
        [neighborhood]
      );

      if (neighborhoodResult.rows.length > 0) {
        wardId = neighborhoodResult.rows[0].ward_id;
      }
    }

    // Update signal with ward_id
    if (wardId) {
      await this.pool.query(
        'UPDATE signals SET ward_id = $1, place_text = $2 WHERE id = $3',
        [wardId, neighborhood, signalId]
      );
    }
  }

  /**
   * Process a raw item through the full pipeline
   * @param {Object} rawData - Raw data from source
   * @param {Object} source - Source configuration
   * @returns {Object|null} Processed signal
   */
  async processItem(rawData, source) {
    try {
      // Normalize
      const signal = this.normalizeSignal(rawData, source);

      // Classify
      const text = `${signal.title || ''} ${signal.body || ''}`;
      signal.category = this.classifySignal(signal.title, signal.body);
      signal.sentiment = this.analyzeSentiment(text);

      // Store
      const stored = await this.storeSignal(signal);

      if (stored) {
        // Geocode
        await this.geocodeSignal(stored.id);
        console.log(`Processed signal: ${stored.id} - ${signal.title?.substring(0, 50)}...`);
        return stored;
      }

      return null;
    } catch (error) {
      console.error('Error processing item:', error);
      return null;
    }
  }

  /**
   * Close database connection
   */
  async close() {
    await this.pool.end();
  }
}

module.exports = BaseCollector;
