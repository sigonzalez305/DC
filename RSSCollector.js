// RSSCollector.js - Collects data from RSS feeds
const BaseCollector = require('./BaseCollector');
const Parser = require('rss-parser');

class RSSCollector extends BaseCollector {
  constructor(config) {
    super(config);
    this.parser = new Parser({
      customFields: {
        item: [
          ['dc:creator', 'creator'],
          ['content:encoded', 'contentEncoded']
        ]
      }
    });
  }

  /**
   * Collect and process RSS feed
   * @param {string} sourceSlug - Source slug identifier
   */
  async collect(sourceSlug) {
    console.log(`Starting RSS collection for: ${sourceSlug}`);

    try {
      // Get source configuration
      const source = await this.getSource(sourceSlug);

      if (!source.url) {
        throw new Error(`No URL configured for source: ${sourceSlug}`);
      }

      // Fetch and parse RSS feed
      console.log(`Fetching RSS feed: ${source.url}`);
      const feed = await this.parser.parseURL(source.url);

      console.log(`Found ${feed.items.length} items in feed`);

      let processedCount = 0;
      let skippedCount = 0;

      // Process each item
      for (const item of feed.items) {
        const rawData = this.parseRSSItem(item);
        const result = await this.processItem(rawData, source);

        if (result) {
          processedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`Collection complete: ${processedCount} new, ${skippedCount} skipped`);

      return {
        source: sourceSlug,
        total: feed.items.length,
        processed: processedCount,
        skipped: skippedCount
      };

    } catch (error) {
      console.error(`Error collecting RSS feed for ${sourceSlug}:`, error);
      throw error;
    }
  }

  /**
   * Parse RSS item into raw data format
   * @param {Object} item - RSS item
   * @returns {Object} Raw data object
   */
  parseRSSItem(item) {
    return {
      id: item.guid || item.link,
      title: item.title,
      body: item.contentEncoded || item.content || item.summary || item.description,
      author: item.creator || item.author,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(item.isoDate || Date.now()),
      url: item.link,
      tags: item.categories || []
    };
  }
}

module.exports = RSSCollector;
