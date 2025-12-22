import { Router, Request, Response } from 'express';
import { query } from '../db/connection';
import { Ward, ApiResponse } from '../models/types';

const router = Router();

// GET /api/wards - Get all wards
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT id, name, ward_number as population,
             ST_AsGeoJSON(geom) as geom,
             created_at
      FROM wards
      ORDER BY id
    `);

    const wards = result.rows.map(row => ({
      ...row,
      geom: row.geom ? JSON.parse(row.geom) : null,
    }));

    const response: ApiResponse<Ward[]> = {
      success: true,
      data: wards,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching wards:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wards',
    });
  }
});

// GET /api/wards/:id - Get a single ward
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, name, ward_number as population,
              ST_AsGeoJSON(geom) as geom,
              created_at
       FROM wards
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Ward not found',
      });
    }

    const ward = {
      ...result.rows[0],
      geom: result.rows[0].geom ? JSON.parse(result.rows[0].geom) : null,
    };

    const response: ApiResponse<Ward> = {
      success: true,
      data: ward,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching ward:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ward',
    });
  }
});

export default router;
