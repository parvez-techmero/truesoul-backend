import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
// import { tasks } from '../db/schema';
import * as schema from '../db/schema';
import 'dotenv/config'

/**
 * Database Configuration
 * 
 * Migrated from Drizzle + SQLite to Drizzle + PostgreSQL:
 * - Previous: Drizzle with SQLite file:./sqlite.db
 * - Current: Drizzle with PostgreSQL localhost:5432/tasks_db
 * 
 * Benefits:
 * - Production-grade database with ACID compliance
 * - Better concurrent performance
 * - Advanced PostgreSQL features (JSON, full-text search, etc.)
 * - Horizontal scaling capabilities
 * - Still maintains Drizzle's excellent performance
 */

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:12345678@localhost:5432/truesoul",
});

// Create Drizzle instance with all tables
export const db = drizzle(pool, { schema });


// Graceful shutdown
process.on('beforeExit', async () => {
  await pool.end();
});

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
