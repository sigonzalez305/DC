import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { Source, ApiResponse } from '../models/types';

const router = Router();

// GET /api/sources - Get all sources
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, is_active } = req.query;

    let sql = 'SELECT * FROM sources WHERE 1=1';
    const params: any[] = [];
    let paramCount = 1;

    if (type) {
      sql += ` AND type = $${paramCount++}`;
      params.push(type);
    }

    if (is_active !== undefined) {
      sql += ` AND is_active = $${paramCount++}`;
      params.push(is_active === 'true');
    }

    sql += ' ORDER BY name';

    const result = await query(sql, params);

    const response: ApiResponse<Source[]> = {
      success: true,
      data: result.rows,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources',
    });
  }
});

// GET /api/sources/:id - Get a single source
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM sources WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Source not found',
      });
    }

    const response: ApiResponse<Source> = {
      success: true,
      data: result.rows[0],
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch source',
    });
  }
});

export default router;
