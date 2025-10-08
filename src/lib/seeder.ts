// Utility to empty all main tables in the database
import { db } from './database';
import {
    usersTable,
    relationshipsTable,
    categoriesTable,
    topicsTable,
    subTopicsTable,
    questionsTable,
    userAnswersTable,
    appSettingsTable,
    deviceTokensTable
} from '../db/schema';
import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';

export async function emptyDatabase() {
    // Order matters due to foreign key constraints
    // await db.delete(deviceTokensTable);
    // await db.delete(userAnswersTable);
    // await db.delete(questionsTable);
    // await db.delete(subTopicsTable);
    // await db.delete(topicsTable);
    // await db.delete(categoriesTable);
    // await db.delete(relationshipsTable);
    // await db.delete(usersTable);
    // await db.delete(appSettingsTable);
    await db.execute(
        `TRUNCATE TABLE 
            user_answers,
            questions,
            sub_topics,
            topics,
            categories,
            relationships,
            users,
            app_settings RESTART IDENTITY
        CASCADE;`
    );
    console.log('All tables emptied.');
}

// Function to read users from CSV file
export async function readUsersFromCSV(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const users: any[] = [];
        const csvFilePath = path.join(__dirname, 'users.csv');
        
        if (!fs.existsSync(csvFilePath)) {
            console.log('users.csv not found, using default user data');
            resolve([]);
            return;
        }

        const stream = fs.createReadStream(csvFilePath)
            .pipe(parse({ 
                delimiter: ',',
                columns: true,
                skip_empty_lines: true,
                trim: true
            }));

        stream.on('data', (row) => {
            // Convert CSV row to user data format
            const userData = {
                uuid: row.uuid || null,
                transactionId: row.transactionId || null,
                socialId: row.socialId || null,
                name: row.name || null,
                gender: row.gender && row.gender.toLowerCase() !== 'null' ? row.gender : null,
                birthDate: row.birthDate && row.birthDate !== 'NULL' ? row.birthDate : null,
                lat: row.lat && row.lat !== 'NULL' ? row.lat : null,
                long: row.long && row.long !== 'NULL' ? row.long : null,
                anniversary: row.anniversary && row.anniversary !== 'NULL' ? row.anniversary : null,
                relationshipStatus: row.relationshipStatus && row.relationshipStatus !== 'NULL' ? row.relationshipStatus : null,
                expectations: row.expectations && row.expectations !== 'NULL' ? row.expectations : null,
                inviteCode: row.inviteCode || null,
                lang: row.lang || 'en',
                distanceUnit: row.distanceUnit || 'km',
                hideContent: row.hideContent === 'True' || row.hideContent === 'true',
                locationPermission: row.locationPermission === 'True' || row.locationPermission === 'true',
                mood: row.mood && row.mood !== 'NULL' ? row.mood : null,
                profileImg: row.profileImg && row.profileImg !== 'NULL' ? row.profileImg : null,
                isActive: row.isActive === 'True' || row.isActive === 'true',
                lastActiveAt: row.lastActiveAt && row.lastActiveAt !== 'NULL' ? new Date(row.lastActiveAt) : null,
                deleted: row.deleted === 'True' || row.deleted === 'true',
                createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
                updatedAt: row.updatedAt ? new Date(row.updatedAt) : new Date(),
            };
            
            // Only add if not marked as deleted
            if (!userData.deleted) {
                users.push(userData);
            }
        });

        stream.on('end', () => {
            console.log(`Successfully read ${users.length} users from CSV`);
            resolve(users);
        });

        stream.on('error', (error) => {
            console.error('Error reading CSV file:', error);
            reject(error);
        });
    });
}

// Function to seed users
export async function seedUsers() {
    try {
        console.log('Seeding users...');
        
        // Try to read from CSV first
        let usersData = await readUsersFromCSV();
        
        // If no CSV data, use default users
        if (usersData.length === 0) {
            usersData = getDefaultUsers();
        }
        
        console.log(`Seeding ${usersData.length} users...`);
        
        // Insert users in batches to handle large datasets
        const batchSize = 50;
        const insertedUsers = [];
        
        for (let i = 0; i < usersData.length; i += batchSize) {
            const batch = usersData.slice(i, i + batchSize);
            const result = await db.insert(usersTable).values(batch).returning();
            insertedUsers.push(...result);
            console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} users`);
        }
        
        console.log(`✅ Successfully seeded ${insertedUsers.length} users`);
        return insertedUsers;
        
    } catch (error) {
        console.error('Error seeding users:', error);
        throw error;
    }
}

// Default users data (fallback)
export function getDefaultUsers() {
    return [{
        uuid: "1",
        transactionId: "1001",
        socialId: "2001",
        name: 'N',
        birthDate: '1990-01-01',
        lat: "12.97160000",
        long: "77.59460000",
        anniversary: '2020-01-01',
        inviteCode: 'INVITE123',
        lang: 'en',
        distanceUnit: 'km',
        hideContent: false,
        locationPermission: true,
        isActive: true,
        lastActiveAt: null,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }, {
        uuid: "2",
        transactionId: "1002",
        socialId: "2002",
        name: 'P',
        birthDate: '1990-01-01',
        lat: "22.97160000",
        long: "87.59460000",
        anniversary: '2020-01-01',
        inviteCode: 'INVITE124',
        lang: 'en',
        distanceUnit: 'km',
        hideContent: false,
        locationPermission: true,
        isActive: true,
        lastActiveAt: null,
        deleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
    }];
}

async function seed() {

    // await emptyDatabase();
    
    // Seed users from CSV
    // const users = await seedUsers();
    // const users = await getDefaultUsers();
    
    // Create relationships for first two users (if available)
    // if (users.length >= 2) {
    //     const payload = {
    //         user1Id: users[0].id,
    //         user2Id: users[1].id,
    //         deleted: false
    //     };
    //     const relationship = await db.insert(relationshipsTable).values(payload).returning();
    //     console.log(`✅ Created relationship between users ${users[0].id} and ${users[1].id}`);
    // }
    
    // Seed categories based on data.csv
    const categoriesData = [
        {
            name: 'Never Have I Ever',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/1.png',
            color: '',
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'This or That',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/2.png',
            color: '',
            sortOrder: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Who Is More Likely To',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/3.png',
            color: '',
            sortOrder: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Would You Rather',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/4.png',
            color: '',
            sortOrder: 4,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Deep Conversations',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/5.png',
            color: '',
            sortOrder: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Discuss Before',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/6.png',
            color: '',
            sortOrder: 6,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Answer With photo',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Categories/7.png',
            color: '',
            sortOrder: 7,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    // await db.insert(categoriesTable).values(categoriesData);

    // Seed topics based on topic.csv
    const topicsData = [
        {
            name: 'Icebreakers',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/1.png',
            color: '',
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Us & Love',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/2.png',
            color: '',
            sortOrder: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Intimacy',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/3.png',
            color: '',
            sortOrder: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Moral Values',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/4.png',
            color: '',
            sortOrder: 4,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Money & Finances',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/5.png',
            color: '',
            sortOrder: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Get to Know Each Other',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/6.png',
            color: '',
            sortOrder: 6,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Adventures',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/7.png',
            color: '',
            sortOrder: 7,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Family',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/8.png',
            color: '',
            sortOrder: 8,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Work-life',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/9.png',
            color: '',
            sortOrder: 9,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Life Style',
            description: '',
            icon: 'https://truesoul.b-cdn.net/icons/Discover/10.png',
            color: '',
            sortOrder: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Daily Questions',
            description: '',
            icon: null,
            color: '',
            sortOrder: 11,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    // await db.insert(topicsTable).values(topicsData);

    // Import required modules for CSV processing
    const fs = require('fs');
    const path = require('path');
    const parse = require('csv-parse/sync').parse;

    // Seed sub topics from CSV
    const subTopicCsvFilePath = path.join(__dirname, 'sub-topic.csv');
    const subTopicCsvData = fs.readFileSync(subTopicCsvFilePath, 'utf8');
    const subTopicRecords = parse(subTopicCsvData, {
        columns: true,
        skip_empty_lines: true
    });

    const subTopicsData = subTopicRecords.map((row: any) => ({
        topicId: row.topicId && row.topicId !== '' ? Number(row.topicId) : null,
        categoryId: row.categoryId && row.categoryId !== '' ? Number(row.categoryId) : null,
        name: row.name,
        description: row.description && row.description !== '' ? row.description : null,
        icon: row.icon && row.icon !== '' ? row.icon : null,
        color: row.color && row.color !== '' ? row.color : null,
        adult: row.adult === 'TRUE' ? true : false,
        sortOrder: row.id ? Number(row.id) : 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    await db.insert(subTopicsTable).values(subTopicsData);
    console.log('Seeded', subTopicsData.length, 'sub-topics!');

    // Seed questions from CSV (850 entries)
    const csvFilePath = path.join(__dirname, 'Relationship App - questions.csv');
    const csvData = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    // Map CSV columns to questionsTable fields
    const questions = records.map((row) => ({
        subTopicId: row.subTopicId ? Number(row.subTopicId) : null,
        questionText: row.questionText,
        questionType: row.questionType,
        optionText: row.optionText && row.optionText !== '' ? row.optionText : null,
        optionImg: row.optionImg && row.optionImg !== '' ? row.optionImg : null,
        sortOrder: row.id ? Number(row.id) : 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    // if (questions.length !== 850) {
    //     throw new Error(`Expected 850 questions, found ${questions.length}`);
    // }

    try {
        await db.insert(questionsTable).values(questions);
    } catch (error) {
        console.log(error);
        
    }
    console.log('Seeded', questions.length, 'questions!');
    console.log('Seeding complete!');
}

// Export seed function for external use
export { seed };

// Run directly if this file is executed
if (require.main === module) {
    seed().catch((err) => {
        console.error('Seeding failed:', err);
        process.exit(1);
    });
}
