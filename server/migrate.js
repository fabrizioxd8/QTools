import { initializeDatabase } from './database.js';

console.log('🔄 Running database migration...');

try {
  initializeDatabase();
  console.log('✅ Database migration completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Database migration failed:', error);
  process.exit(1);
}