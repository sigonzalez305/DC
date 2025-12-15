import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { ApiResponse } from '../models/types';

const router = Router();

interface SentimentStats {
  positive: number;
  neutral: number;
  negative: number;
  total: number;
  average_score: number;
}

// GET /api/sentiment/citywide - Calculate overall citywide sentiment
router.get('/citywide', async (req: Request, res: Response) => {
  try {
    // Get counts by sentiment type
    const result = await query(`
      SELECT
        sentiment,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_score
      FROM signals
      WHERE timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY sentiment
    `);

    // Initialize stats
    const stats: SentimentStats = {
      positive: 0,
      neutral: 0,
      negative: 0,
      total: 0,
      average_score: 0,
    };

    // Process results
    let totalScore = 0;
    let totalCount = 0;

    for (const row of result.rows) {
      const count = parseInt(row.count);
      const avgScore = parseFloat(row.avg_score);

      stats[row.sentiment as keyof Omit<SentimentStats, 'total' | 'average_score'>] = count;
      totalCount += count;
      totalScore += avgScore * count;
    }

    stats.total = totalCount;
    stats.average_score = totalCount > 0 ? Math.round((totalScore / totalCount) * 100) / 100 : 0;

    const response: ApiResponse<SentimentStats> = {
      success: true,
      data: stats,
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating citywide sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate citywide sentiment',
    });
  }
});

// GET /api/sentiment/by-ward - Get sentiment breakdown by ward
router.get('/by-ward', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT
        w.id as ward_id,
        w.name as ward_name,
        s.sentiment,
        COUNT(*) as count,
        AVG(s.sentiment_score) as avg_score
      FROM signals s
      LEFT JOIN wards w ON s.ward_id = w.id
      WHERE s.timestamp >= NOW() - INTERVAL '7 days'
      GROUP BY w.id, w.name, s.sentiment
      ORDER BY w.id, s.sentiment
    `);

    const response: ApiResponse<any[]> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  } catch (error) {
    console.error('Error calculating sentiment by ward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate sentiment by ward',
    });
  }
});

export default router;
