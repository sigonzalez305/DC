import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { Signal, ApiResponse } from '../models/types';

const router = Router();

// GET /api/signals - Get all signals with optional filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { ward_id, sentiment, category, limit = 100 } = req.query;

    let sql = 'SELECT * FROM signals WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (ward_id) {
      sql += ` AND ward_id = $${paramCount++}`;
      params.push(ward_id);
    }

    if (sentiment) {
      sql += ` AND sentiment = $${paramCount++}`;
      params.push(sentiment);
    }

    if (category) {
      sql += ` AND category = $${paramCount++}`;
      params.push(category);
    }

    sql += ` ORDER BY timestamp DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await query(sql, params);

    const response: ApiResponse<Signal[]> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching signals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signals',
    });
  }
});

// GET /api/signals/:id - Get a single signal
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM signals WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Signal not found',
      });
    }

    const response: ApiResponse<Signal> = {
      success: true,
      data: result.rows[0],
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching signal:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch signal',
    });
  }
});

export default router;
