// scheduler.ts - Automated collection scheduler
import { Pool } from 'pg';
import { dbConfig } from '../config/database';
import { RSSCollector } from './RSSCollector';
import { Source } from './BaseCollector';

interface SchedulerStats {
  totalSignals: any[];
  signalsByCategory: any[];
  signalsByWard: any[];
  recentSignals: any[];
  signalsBySentiment: any[];
}

export class CollectionScheduler {
  private pool: Pool;
  private isRunning: boolean = false;
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.pool = new Pool(dbConfig);
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Scheduler already running');
      return;
    }

    console.log('=== DC Community Pulse Scheduler Starting ===\n');
    this.isRunning = true;

    const sources = await this.getActiveSources('GOV_RSS');

    console.log(`Found ${sources.length} active RSS sources`);

    for (const source of sources) {
      this.scheduleSource(source);
    }

    console.log('\n=== Scheduler Running ===');
    console.log('Press Ctrl+C to stop\n');
  }

  /**
   * Get active sources by type
   */
  async getActiveSources(sourceType: string): Promise<Source[]> {
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
   * Get all active sources
   */
  async getAllActiveSources(): Promise<Source[]> {
    const query = `
      SELECT * FROM sources
      WHERE is_active = true
      ORDER BY refresh_rate_minutes ASC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Schedule a source for regular collection
   */
  scheduleSource(source: Source): void {
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
   */
  async collectFromSource(source: Source): Promise<{ processed: number; skipped: number } | null> {
    const timestamp = new Date().toISOString();
    console.log(`\n[${timestamp}] Collecting from: ${source.name}`);

    try {
      const collector = new RSSCollector();
      const result = await collector.collect(source.slug);

      console.log(`  ✓ Processed: ${result.processed} new signals`);
      console.log(`  - Skipped: ${result.skipped} duplicates`);

      await collector.close();

      await this.updateLastCollection(source.id);

      return { processed: result.processed, skipped: result.skipped };
    } catch (error: any) {
      console.error(`  ✗ Error collecting from ${source.name}:`, error.message);
      return null;
    }
  }

  /**
   * Run a single collection for a specific source
   */
  async runOnce(sourceSlug: string): Promise<any> {
    const query = 'SELECT * FROM sources WHERE slug = $1 AND is_active = true';
    const result = await this.pool.query(query, [sourceSlug]);

    if (result.rows.length === 0) {
      throw new Error(`Source not found or inactive: ${sourceSlug}`);
    }

    return this.collectFromSource(result.rows[0]);
  }

  /**
   * Run collection for all active sources once
   */
  async runAll(): Promise<{ source: string; result: any }[]> {
    const sources = await this.getAllActiveSources();
    const results: { source: string; result: any }[] = [];

    for (const source of sources) {
      if (source.source_type === 'GOV_RSS') {
        const result = await this.collectFromSource(source);
        results.push({ source: source.slug, result });
      }
    }

    return results;
  }

  /**
   * Update source's last collection timestamp
   */
  private async updateLastCollection(sourceId: number): Promise<void> {
    await this.pool.query(
      'UPDATE sources SET updated_at = NOW() WHERE id = $1',
      [sourceId]
    );
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
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
  async getStats(): Promise<SchedulerStats> {
    const queries = {
      totalSignals: 'SELECT COUNT(*) FROM signals',
      signalsByCategory: 'SELECT category, COUNT(*) as count FROM signals GROUP BY category ORDER BY count DESC',
      signalsByWard: 'SELECT w.name, COUNT(s.id) as count FROM wards w LEFT JOIN signals s ON w.id = s.ward_id GROUP BY w.id, w.name ORDER BY w.ward_number',
      recentSignals: "SELECT COUNT(*) FROM signals WHERE timestamp > NOW() - INTERVAL '24 hours'",
      signalsBySentiment: 'SELECT sentiment, COUNT(*) as count FROM signals WHERE sentiment IS NOT NULL GROUP BY sentiment ORDER BY count DESC',
    };

    const stats: any = {};

    for (const [key, query] of Object.entries(queries)) {
      const result = await this.pool.query(query);
      stats[key] = result.rows;
    }

    return stats as SchedulerStats;
  }

  /**
   * Display current statistics
   */
  async displayStats(): Promise<SchedulerStats> {
    const stats = await this.getStats();

    console.log('\n=== Collection Statistics ===\n');

    console.log(`Total Signals: ${stats.totalSignals[0].count}`);
    console.log(`Last 24 Hours: ${stats.recentSignals[0].count}`);

    console.log('\nBy Category:');
    stats.signalsByCategory.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${(row.category || 'unknown').padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });

    console.log('\nBy Sentiment:');
    stats.signalsBySentiment.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${(row.sentiment || 'unknown').padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });

    console.log('\nBy Ward:');
    stats.signalsByWard.forEach(row => {
      const bar = '█'.repeat(Math.floor(row.count / 10));
      console.log(`  ${(row.name || 'unknown').padEnd(10)}: ${row.count.toString().padStart(4)} ${bar}`);
    });

    return stats;
  }

  /**
   * Check if scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduled sources
   */
  getScheduledSources(): string[] {
    return Array.from(this.intervals.keys());
  }

  /**
   * Close pool connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI Interface
if (require.main === module) {
  const scheduler = new CollectionScheduler();

  const command = process.argv[2];

  if (command === 'stats') {
    scheduler.displayStats().then(() => {
      scheduler.close();
      process.exit(0);
    });
  } else if (command === 'once') {
    const sourceSlug = process.argv[3];
    if (sourceSlug) {
      scheduler.runOnce(sourceSlug).then(() => {
        scheduler.close();
        process.exit(0);
      });
    } else {
      scheduler.runAll().then(() => {
        scheduler.close();
        process.exit(0);
      });
    }
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

export default CollectionScheduler;
