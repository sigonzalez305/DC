// scheduler.js - Automated collection scheduler
require('dotenv').config();
const RSSCollector = require('./RSSCollector');
const { Pool } = require('pg');

class CollectionScheduler {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'dc_community_pulse',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
    });
    this.isRunning = false;
    this.intervals = new Map();
  }

  /**
   * Start the scheduler
   */
  async start() {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    console.log('=== DC Community Pulse Scheduler Starting ===\n');
    this.isRunning = true;

    // Get all active RSS sources
    const sources = await this.getActiveSources('GOV_RSS');

    console.log(`Found ${sources.length} active RSS sources`);

    // Schedule each source
    for (const source of sources) {
      this.scheduleSource(source);
    }

    console.log('\n=== Scheduler Running ===');
    console.log('Press Ctrl+C to stop\n');
  }

  /**
   * Get active sources by type
   * @param {string} sourceType - Source type to filter
   * @returns {Array} Active sources
   */
  async getActiveSources(sourceType) {
    const query = `
      SELECT * FROM sources 
      WHERE source_type = $1 
      AND is_active = true
      ORDER BY refresh_rate_minutes ASC
    `;

    const result = await this.pool.query(query, [sourceType]);
    return result.rows;
  }

  /**
   * Schedule a source for regular collection
   * @param {Object} source - Source configuration
   */
  scheduleSource(source) {
    const intervalMs = source.refresh_rate_minutes * 60 * 1000;

    console.log(`Scheduling ${source.name} every ${source.refresh_rate_minutes} minutes`);

    // Run immediately
    this.collectFromSource(source);

    // Then run on interval
    const intervalId = setInterval(() => {
      this.collectFromSource(source);
    }, intervalMs);

    this.intervals.set(source.slug, intervalId);
  }

  /**
   * Collect from a single source
   * @param {Object} source - Source configuration
   */
  async collectFromSource(source) {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Collecting from: ${source.name}`);

    try {
      const collector = new RSSCollector();
      const result = await collector.collect(source.slug);

      console.log(`  ✓ Processed: ${result.processed} new signals`);
      console.log(`  - Skipped: ${result.skipped} duplicates`);

      await collector.close();

      // Update last collection time
      await this.updateLastCollection(source.id);

    } catch (error) {
      console.error(`  ✗ Error collecting from ${source.name}:`, error.message);
    }
  }

  /**
   * Update source's last collection timestamp
   * @param {number} sourceId - Source ID
   */
  async updateLastCollection(sourceId) {
    await this.pool.query(
      'UPDATE sources SET updated_at = NOW() WHERE id = $1',
      [sourceId]
    );
  }

  /**
   * Stop the scheduler
   */
  stop() {
    console.log('\n=== Stopping Scheduler ===');

    for (const [slug, intervalId] of this.intervals) {
      clearInterval(intervalId);
      console.log(`Stopped: ${slug}`);
    }

    this.intervals.clear();
    this.isRunning = false;
    this.pool.end();

    console.log('Scheduler stopped');
  }

  /**
   * Get collection statistics
   */
  async getStats() {
    const queries = {
      totalSignals: 'SELECT COUNT(*) FROM signals',
      signalsByCategory: 'SELECT category, COUNT(*) as count FROM signals GROUP BY category ORDER BY count DESC',
      signalsByWard: 'SELECT w.name, COUNT(s.id) as count FROM wards w LEFT JOIN signals s ON w.id = s.ward_id GROUP BY w.id, w.name ORDER BY w.ward_number',
      recentSignals: 'SELECT COUNT(*) FROM signals WHERE timestamp > NOW() - INTERVAL \'24 hours\'',
      signalsBySentiment: 'SELECT sentiment, COUNT(*) as count FROM signals WHERE sentiment IS NOT NULL GROUP BY sentiment ORDER BY count DESC'
    };

    const stats = {};

    for (const [key, query] of Object.entries(queries)) {
      const result = await this.pool.query(query);
      stats[key] = result.rows;
    }

    return stats;
  }

  /**
   * Display current statistics
   */
  async displayStats() {
    const stats = await this.getStats();

    console.log('\n=== Collection Statistics ===\n');

    console.log(`Total Signals: ${stats.totalSignals[0].count}`);
    console.log(`Last 24 Hours: ${stats.recentSignals[0].count}`);

    console.log('\nBy Category:');
    stats.signalsByCategory.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${row.category?.padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });

    console.log('\nBy Sentiment:');
    stats.signalsBySentiment.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${row.sentiment?.padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });

    console.log('\nBy Ward:');
    stats.signalsByWard.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${row.name?.padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });
  }
}

// CLI Interface
if (require.main === module) {
  const scheduler = new CollectionScheduler();

  const command = process.argv[2];

  if (command === 'stats') {
    scheduler.displayStats().then(() => {
      scheduler.pool.end();
      process.exit(0);
    });
  } else {
    // Start scheduler
    scheduler.start();

    // Handle shutdown gracefully
    process.on('SIGINT', () => {
      scheduler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      scheduler.stop();
      process.exit(0);
    });
  }
}

module.exports = CollectionScheduler;
