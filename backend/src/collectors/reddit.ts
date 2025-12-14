import Snoowrap, { Submission } from 'snoowrap';
import { pool } from '../db/connection';
import { analyzeCombinedSentiment } from '../utils/sentiment';

interface RedditCollectorConfig {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  username?: string;
  password?: string;
}

interface Signal {
  source_id: number;
  source_type: string;
  timestamp: Date;
  title: string | null;
  body: string;
  author: string;
  url: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  sentiment_score: number;
  category?: string;
}

export class RedditCollector {
  private reddit: Snoowrap;
  private sourceId: number | null = null;

  constructor(config: RedditCollectorConfig) {
    this.reddit = new Snoowrap({
      userAgent: config.userAgent,
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      username: config.username,
      password: config.password,
    });

    // Configure request delay to respect Reddit's rate limits
    this.reddit.config({ requestDelay: 1000, warnings: false });
  }

  /**
   * Initialize the collector by getting the source_id from the database
   */
  async initialize(): Promise<void> {
    const result = await pool.query(
      'SELECT id FROM sources WHERE slug = $1',
      ['reddit-washingtondc']
    );

    if (result.rows.length === 0) {
      throw new Error('Reddit source not found in database. Please run seeds first.');
    }

    this.sourceId = result.rows[0].id;
    console.log(`✓ Reddit collector initialized with source_id: ${this.sourceId}`);
  }

  /**
   * Fetches recent posts from r/washingtondc
   * @param limit - Number of posts to fetch (default: 25)
   * @returns Array of processed signals
   */
  async fetchPosts(limit: number = 25): Promise<Signal[]> {
    if (!this.sourceId) {
      throw new Error('Collector not initialized. Call initialize() first.');
    }

    console.log(`🔍 Fetching ${limit} posts from r/washingtondc...`);

    try {
      const subreddit = await (this.reddit.getSubreddit('washingtondc') as any);
      const posts = await (subreddit.getNew({ limit }) as any);

      console.log(`✓ Fetched ${posts.length} posts from Reddit`);

      const signals: Signal[] = [];

      for (const post of posts) {
        // Skip if already in database
        const existing = await pool.query(
          'SELECT id FROM signals WHERE url = $1',
          [`https://reddit.com${post.permalink}`]
        );

        if (existing.rows.length > 0) {
          console.log(`⏭️  Skipping post ${post.id} (already exists)`);
          continue;
        }

        // Analyze sentiment
        const sentiment = analyzeCombinedSentiment(
          post.title,
          post.selftext || post.title
        );

        const signal: Signal = {
          source_id: this.sourceId,
          source_type: 'reddit',
          timestamp: new Date(post.created_utc * 1000),
          title: post.title,
          body: post.selftext || post.title,
          author: post.author.name,
          url: `https://reddit.com${post.permalink}`,
          sentiment: sentiment.sentiment,
          sentiment_score: sentiment.score,
          category: this.categorizePost(post),
        };

        signals.push(signal);
      }

      console.log(`✓ Processed ${signals.length} new signals`);
      return signals;
    } catch (error) {
      console.error('❌ Error fetching Reddit posts:', error);
      throw error;
    }
  }

  /**
   * Saves signals to the database
   * @param signals - Array of signals to save
   */
  async saveSignals(signals: Signal[]): Promise<void> {
    console.log(`💾 Saving ${signals.length} signals to database...`);

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (const signal of signals) {
        await client.query(
          `INSERT INTO signals
           (source_id, source_type, timestamp, title, body, author, url,
            sentiment, sentiment_score, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            signal.source_id,
            signal.source_type,
            signal.timestamp,
            signal.title,
            signal.body,
            signal.author,
            signal.url,
            signal.sentiment,
            signal.sentiment_score,
            signal.category,
          ]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Successfully saved ${signals.length} signals`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error saving signals:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Updates the last_fetched_at timestamp for the source
   */
  async updateLastFetched(): Promise<void> {
    await pool.query(
      'UPDATE sources SET last_fetched_at = CURRENT_TIMESTAMP WHERE id = $1',
      [this.sourceId]
    );
  }

  /**
   * Main collection method that fetches and saves posts
   * @param limit - Number of posts to fetch
   */
  async collect(limit: number = 25): Promise<void> {
    await this.initialize();
    const signals = await this.fetchPosts(limit);

    if (signals.length > 0) {
      await this.saveSignals(signals);
    }

    await this.updateLastFetched();
    console.log('✅ Collection completed successfully');
  }

  /**
   * Categorizes a Reddit post based on its flair and content
   * @param post - The Reddit submission
   * @returns Category string
   */
  private categorizePost(post: Submission): string {
    const flair = post.link_flair_text?.toLowerCase() || '';
    const title = post.title.toLowerCase();

    // Category mapping based on common r/washingtondc flairs and keywords
    if (flair.includes('event') || title.includes('event')) return 'events';
    if (flair.includes('crime') || title.includes('crime') || title.includes('police')) return 'crime';
    if (flair.includes('transit') || title.includes('metro') || title.includes('bus')) return 'transportation';
    if (flair.includes('housing') || title.includes('apartment') || title.includes('rent')) return 'housing';
    if (flair.includes('food') || title.includes('restaurant') || title.includes('food')) return 'food';
    if (flair.includes('photo') || title.includes('photo') || title.includes('picture')) return 'photos';
    if (flair.includes('question') || title.includes('?')) return 'questions';
    if (flair.includes('news')) return 'news';

    return 'general';
  }
}

/**
 * Standalone function to run the Reddit collector
 */
export async function runRedditCollector(): Promise<void> {
  const config: RedditCollectorConfig = {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'DC Community Pulse v1.0.0',
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  };

  if (!config.clientId || !config.clientSecret) {
    throw new Error('Reddit API credentials not configured. Please set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET in .env');
  }

  const collector = new RedditCollector(config);
  await collector.collect();
}

// Allow running this file directly
if (require.main === module) {
  runRedditCollector()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
