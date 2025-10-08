import 'dotenv/config';
import { seed } from './src/lib/seeder';

// Run seeder from root directory with proper environment
console.log('🌱 Starting database seeding...');
console.log('📦 Database URL:', process.env.DATABASE_URL ? 'Loaded from .env' : 'Using default');

seed().catch((err: Error) => {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
});
