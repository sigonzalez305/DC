import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from './connection';

async function runSeeds() {
  try {
    console.log('🌱 Running database seeds...\n');

    const seedsDir = join(__dirname, 'seeds');
    const seedFiles = readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of seedFiles) {
      console.log(`▶️  Running ${file}...`);
      const sql = readFileSync(join(seedsDir, file), 'utf-8');

      await pool.query(sql);

      console.log(`✅ Completed ${file}\n`);
    }

    console.log('✅ All seeds completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runSeeds().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { runSeeds };
