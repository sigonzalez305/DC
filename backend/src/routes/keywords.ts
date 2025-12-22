import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { Signal, ApiResponse } from '../models/types';

const router = Router();

// Common English stop words to filter out
const STOP_WORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said', 'did', 'having',
  'may', 'should', 'does', 'am', 'being', 'might', 'must', 'shall', 'can',
  'here', 'more', 'very', 'too', 'such', 'much', 'many', 'where', 'why', 'how',
  'around', 'every', 'still', 'really', 'something', 'however', 'those', 'another',
]);

export interface Keyword {
  word: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

// GET /api/keywords - Extract and return top keywords from recent signals
router.get('/', async (req: Request, res: Response) => {
  try {
    const { limit = 500, top = 20 } = req.query;

    // Fetch recent signals
    const result = await query(
      'SELECT body, sentiment, tags as keywords FROM signals ORDER BY timestamp DESC LIMIT $1',
      [limit]
    );

    const signals: Signal[] = result.rows;

    if (signals.length === 0) {
      return res.json({
        success: true,
        data: [],
      });
    }

    // Extract keywords from signals
    const keywordMap = new Map<string, { count: number; sentiments: string[] }>();

    signals.forEach(signal => {
      let words: string[] = [];

      // Use keywords from signal if available, otherwise extract from body
      if (signal.keywords && signal.keywords.length > 0) {
        words = signal.keywords.map(k => k.toLowerCase());
      } else {
        // Extract words from body
        words = signal.body
          .toLowerCase()
          .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
          .split(/\s+/)
          .filter(word => {
            // Filter out short words and stop words
            return word.length > 3 && !STOP_WORDS.has(word);
          });
      }

      // Count each word and track sentiments
      words.forEach(word => {
        if (!keywordMap.has(word)) {
          keywordMap.set(word, { count: 0, sentiments: [] });
        }
        const data = keywordMap.get(word)!;
        data.count++;
        data.sentiments.push(signal.sentiment);
      });
    });

    // Convert to array and calculate dominant sentiment
    const keywords: Keyword[] = [];
    keywordMap.forEach((value, word) => {
      const sentimentCounts = {
        positive: value.sentiments.filter(s => s === 'positive').length,
        neutral: value.sentiments.filter(s => s === 'neutral').length,
        negative: value.sentiments.filter(s => s === 'negative').length,
      };

      // Determine dominant sentiment
      const dominantSentiment =
        sentimentCounts.positive > sentimentCounts.negative && sentimentCounts.positive > sentimentCounts.neutral
          ? 'positive'
          : sentimentCounts.negative > sentimentCounts.neutral
          ? 'negative'
          : 'neutral';

      keywords.push({
        word,
        count: value.count,
        sentiment: dominantSentiment as 'positive' | 'neutral' | 'negative',
      });
    });

    // Sort by count and return top N
    const topKeywords = keywords
      .sort((a, b) => b.count - a.count)
      .slice(0, Number(top));

    const response: ApiResponse<Keyword[]> = {
      success: true,
      data: topKeywords,
    };

    res.json(response);
  } catch (error) {
    console.error('Error extracting keywords:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to extract keywords',
    });
  }
});

export default router;
