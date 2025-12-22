import { Router } from 'express';
import { query } from '../db/connection';
import { generateMockSignals } from '../services/generators/mockData';

const router = Router();

router.post('/generate-mock-data', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 50;
    const signals = generateMockSignals(count);

    // Insert into database
    for (const signal of signals) {
      await query(
        `INSERT INTO signals
         (source_id, timestamp, body, author, sentiment, tags, ward_id, category, platform)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          signal.source_id,
          signal.timestamp,
          signal.body,
          signal.author,
          signal.sentiment,
          signal.keywords,
          signal.ward_id,
          'community',
          signal.source_type
        ]
      );
    }

    res.json({ success: true, count: signals.length, message: `Generated ${signals.length} mock signals` });
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json({ error: 'Failed to generate mock data' });
  }
});

export default router;
