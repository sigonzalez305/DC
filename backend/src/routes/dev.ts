import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { generateMockSignals } from '../services/mockData';
import { ApiResponse } from '../models/types';

const router = Router();

// POST /api/dev/generate-mock-data - Generate mock signals for development
router.post('/generate-mock-data', async (req: Request, res: Response) => {
  try {
    const { count = 50 } = req.body;

    // Validate count
    if (count < 1 || count > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Count must be between 1 and 1000',
      });
    }

    // Get the Reddit source (should exist from seed data)
    const sourceResult = await query(
      'SELECT id FROM sources WHERE slug = $1',
      ['reddit-washingtondc']
    );

    if (sourceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Reddit source not found. Please run database seed first.',
      });
    }

    const sourceId = sourceResult.rows[0].id;

    // Generate mock signals
    console.log(`Generating ${count} mock signals...`);
    const mockSignals = generateMockSignals(count, sourceId);

    // Insert signals into database
    let inserted = 0;
    const errors: string[] = [];

    for (const signal of mockSignals) {
      try {
        await query(
          `INSERT INTO signals (
            source_id, source_type, timestamp, title, body, author, url,
            sentiment, sentiment_score, latitude, longitude, ward_id, keywords, category
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
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
            signal.latitude,
            signal.longitude,
            signal.ward_id,
            signal.keywords,
            signal.category,
          ]
        );
        inserted++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Update last_fetched_at for the source
    await query(
      'UPDATE sources SET last_fetched_at = NOW() WHERE id = $1',
      [sourceId]
    );

    console.log(`✓ Inserted ${inserted} mock signals`);

    const response: ApiResponse<{
      inserted: number;
      requested: number;
      errors: string[];
    }> = {
      success: true,
      data: {
        inserted,
        requested: count,
        errors,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate mock data',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// DELETE /api/dev/clear-signals - Clear all signals (for development)
router.delete('/clear-signals', async (req: Request, res: Response) => {
  try {
    const result = await query('DELETE FROM signals');

    console.log(`✓ Deleted ${result.rowCount} signals`);

    const response: ApiResponse<{ deleted: number }> = {
      success: true,
      data: {
        deleted: result.rowCount || 0,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error clearing signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear signals',
    });
  }
});

export default router;
