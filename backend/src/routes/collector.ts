import { Router, Request, Response } from 'express';
import { RSSCollector, CollectionScheduler } from '../collectors';

const router = Router();

// Singleton scheduler instance for the API
let schedulerInstance: CollectionScheduler | null = null;

function getScheduler(): CollectionScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CollectionScheduler();
  }
  return schedulerInstance;
}

// GET /api/collector/status - Get collector/scheduler status
router.get('/status', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();
    const isRunning = scheduler.isSchedulerRunning();
    const scheduledSources = scheduler.getScheduledSources();

    res.json({
      success: true,
      data: {
        isRunning,
        scheduledSources,
        scheduledCount: scheduledSources.length,
      },
    });
  } catch (error) {
    console.error('Error getting collector status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get collector status',
    });
  }
});

// GET /api/collector/sources - Get all available sources
router.get('/sources', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();
    const sources = await scheduler.getAllActiveSources();

    res.json({
      success: true,
      data: sources,
    });
  } catch (error) {
    console.error('Error getting sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sources',
    });
  }
});

// GET /api/collector/stats - Get collection statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();
    const stats = await scheduler.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get statistics',
    });
  }
});

// POST /api/collector/run/:slug - Run collector for a specific source
router.post('/run/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const collector = new RSSCollector();
    const result = await collector.collect(slug);
    await collector.close();

    res.json({
      success: true,
      data: {
        source: slug,
        total: result.total,
        processed: result.processed,
        skipped: result.skipped,
      },
    });
  } catch (error: any) {
    console.error('Error running collector:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run collector',
    });
  }
});

// POST /api/collector/run-all - Run all active collectors once
router.post('/run-all', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();
    const results = await scheduler.runAll();

    res.json({
      success: true,
      data: {
        results,
        count: results.length,
      },
    });
  } catch (error) {
    console.error('Error running all collectors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run collectors',
    });
  }
});

// POST /api/collector/scheduler/start - Start the automated scheduler
router.post('/scheduler/start', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();

    if (scheduler.isSchedulerRunning()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduler is already running',
      });
    }

    await scheduler.start();

    res.json({
      success: true,
      message: 'Scheduler started',
      data: {
        scheduledSources: scheduler.getScheduledSources(),
      },
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start scheduler',
    });
  }
});

// POST /api/collector/scheduler/stop - Stop the automated scheduler
router.post('/scheduler/stop', async (req: Request, res: Response) => {
  try {
    const scheduler = getScheduler();

    if (!scheduler.isSchedulerRunning()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduler is not running',
      });
    }

    scheduler.stop();
    schedulerInstance = null;

    res.json({
      success: true,
      message: 'Scheduler stopped',
    });
  } catch (error) {
    console.error('Error stopping scheduler:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop scheduler',
    });
  }
});

export default router;
