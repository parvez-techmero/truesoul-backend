#!/usr/bin/env ts-node

// Standalone script to seed users only
import { seedUsers, readUsersFromCSV, getDefaultUsers } from './seeder';
import { db } from './database';
import { usersTable } from '../db/schema';

async function runUserSeeder() {
    console.log('🌱 Starting Users Seeder...');
    console.log('=====================================');
    
    try {
        // Only seed users, don't empty the entire database
        const users = await seedUsers();
        
        console.log('=====================================');
        console.log('✅ Users seeding completed successfully!');
        console.log(`📊 Total users seeded: ${users.length}`);
        console.log('=====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Users seeding failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    runUserSeeder();
}