import { Router } from 'express';
import signalsRouter from './signals';
import wardsRouter from './wards';
import sourcesRouter from './sources';
import sentimentRouter from './sentiment';
import devRouter from './dev';
import keywordsRouter from './keywords';
import collectorRouter from './collector';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DC Community Pulse API is running',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/signals', signalsRouter);
router.use('/wards', wardsRouter);
router.use('/sources', sourcesRouter);
router.use('/sentiment', sentimentRouter);
router.use('/keywords', keywordsRouter);
router.use('/collector', collectorRouter);
router.use('/dev', devRouter);

export default router;
