// test_collector.js - Test script for RSS collector
require('dotenv').config();
const RSSCollector = require('./RSSCollector');

async function testMayorNewsroom() {
  console.log('=== Testing Mayor\'s Newsroom RSS Collector ===\n');

  const collector = new RSSCollector();

  try {
    // Test with Mayor's newsroom
    const result = await collector.collect('mayor_newsroom');

    console.log('\n=== Collection Results ===');
    console.log(JSON.stringify(result, null, 2));

    // Query to see what was collected
    const query = `
      SELECT 
        s.id,
        s.title,
        s.category,
        s.sentiment,
        s.ward_id,
        w.name as ward_name,
        s.place_text,
        s.timestamp
      FROM signals s
      LEFT JOIN wards w ON s.ward_id = w.id
      WHERE s.source_id = (SELECT id FROM sources WHERE slug = 'mayor_newsroom')
      ORDER BY s.timestamp DESC
      LIMIT 10
    `;

    const signals = await collector.pool.query(query);

    console.log('\n=== Recent Signals from Mayor\'s Newsroom ===');
    signals.rows.forEach(signal => {
      console.log(`\nID: ${signal.id}`);
      console.log(`Title: ${signal.title}`);
      console.log(`Category: ${signal.category}`);
      console.log(`Sentiment: ${signal.sentiment}`);
      console.log(`Ward: ${signal.ward_name || 'Unassigned'}`);
      console.log(`Location: ${signal.place_text || 'None detected'}`);
      console.log(`Time: ${signal.timestamp}`);
    });

    // Get category counts
    const categoryQuery = `
      SELECT 
        category,
        COUNT(*) as count
      FROM signals
      WHERE source_id = (SELECT id FROM sources WHERE slug = 'mayor_newsroom')
      GROUP BY category
      ORDER BY count DESC
    `;

    const categories = await collector.pool.query(categoryQuery);

    console.log('\n=== Category Distribution ===');
    categories.rows.forEach(row => {
      console.log(`${row.category}: ${row.count}`);
    });

  } catch (error) {
    console.error('Error testing collector:', error);
  } finally {
    await collector.close();
  }
}

// Run the test
testMayorNewsroom();
