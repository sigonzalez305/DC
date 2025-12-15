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
         (id, source_id, source_type, timestamp, body, author, sentiment, sentiment_score, keywords, ward_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          signal.id,
          signal.source_id,
          signal.source_type,
          signal.timestamp,
          signal.body,
          signal.author,
          signal.sentiment,
          signal.sentiment_score,
          signal.keywords,
          signal.ward_id
        ]
      );
    }

    res.json({ success: true, count: signals.length, signals });
  } catch (error) {
    console.error('Error generating mock data:', error);
    res.status(500).json({ error: 'Failed to generate mock data' });
  }
});

export default router;
