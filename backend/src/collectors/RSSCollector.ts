// RSSCollector.ts - Collects data from RSS feeds
import Parser from 'rss-parser';
import { BaseCollector, RawData, Source } from './BaseCollector';

interface RSSItem {
  guid?: string;
  link?: string;
  title?: string;
  contentEncoded?: string;
  content?: string;
  summary?: string;
  description?: string;
  creator?: string;
  author?: string;
  pubDate?: string;
  isoDate?: string;
  categories?: string[];
}

export interface CollectionResult {
  source: string;
  total: number;
  processed: number;
  skipped: number;
}

export class RSSCollector extends BaseCollector {
  private parser: Parser;

  constructor(config: any = {}) {
    super(config);
    this.parser = new Parser({
      customFields: {
        item: [
          ['dc:creator', 'creator'],
          ['content:encoded', 'contentEncoded'],
        ],
      },
    });
  }

  /**
   * Collect and process RSS feed
   */
  async collect(sourceSlug: string): Promise<CollectionResult> {
    console.log(`Starting RSS collection for: ${sourceSlug}`);

    try {
      const source = await this.getSource(sourceSlug);

      if (!source.url) {
        throw new Error(`No URL configured for source: ${sourceSlug}`);
      }

      console.log(`Fetching RSS feed: ${source.url}`);
      const feed = await this.parser.parseURL(source.url);

      console.log(`Found ${feed.items.length} items in feed`);

      let processedCount = 0;
      let skippedCount = 0;

      for (const item of feed.items) {
        const rawData = this.parseRSSItem(item as RSSItem);
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
        skipped: skippedCount,
      };
    } catch (error) {
      console.error(`Error collecting RSS feed for ${sourceSlug}:`, error);
      throw error;
    }
  }

  /**
   * Parse RSS item into raw data format
   */
  private parseRSSItem(item: RSSItem): RawData {
    return {
      id: item.guid || item.link,
      title: item.title,
      body: item.contentEncoded || item.content || item.summary || item.description,
      author: item.creator || item.author,
      timestamp: item.pubDate ? new Date(item.pubDate) : new Date(item.isoDate || Date.now()),
      url: item.link,
      tags: item.categories || [],
    };
  }
}

export default RSSCollector;
