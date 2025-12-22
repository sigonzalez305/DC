// run-collector.ts - Run collector for a specific source
import { config } from 'dotenv';
config();

import { RSSCollector, CollectionScheduler } from '../collectors';

async function runCollector() {
  const sourceSlug = process.argv[2];

  if (!sourceSlug) {
    console.log('Usage: npm run collector:run <source-slug>');
    console.log('Example: npm run collector:run mayor_newsroom');
    console.log('\nAvailable sources:');

    const scheduler = new CollectionScheduler();
    const sources = await scheduler.getAllActiveSources();

    sources.forEach(source => {
      console.log(`  - ${source.slug} (${source.name})`);
    });

    await scheduler.close();
    process.exit(1);
  }

  console.log(`=== Running Collector for: ${sourceSlug} ===\n`);

  const collector = new RSSCollector();

  try {
    const result = await collector.collect(sourceSlug);

    console.log('\n=== Collection Complete ===');
    console.log(`Total items: ${result.total}`);
    console.log(`Processed: ${result.processed}`);
    console.log(`Skipped: ${result.skipped}`);

  } catch (error) {
    console.error('Error running collector:', error);
    process.exit(1);
  } finally {
    await collector.close();
  }
}

runCollector();
