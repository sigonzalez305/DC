import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { pool } from './connection';

async function runMigrations() {
  try {
    console.log('🔄 Running database migrations...\n');

    // Create migrations tracking table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = join(__dirname, 'migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      // Check if migration already executed
      const { rows } = await pool.query(
        'SELECT id FROM migrations WHERE name = $1',
        [file]
      );

      if (rows.length > 0) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${file}...`);
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');

      await pool.query(sql);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [file]);

      console.log(`✅ Completed ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!\n');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { runMigrations };
