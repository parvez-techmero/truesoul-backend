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
            device_tokens,
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

async function seed() {

    await emptyDatabase();
    // const userData = {
    //     uuid: "1",
    //     transactionId: "1001",
    //     socialId: "2001",
    //     name: 'Test User',
    //     gender: 'male',
    //     birthDate: new Date('1990-01-01').toISOString().slice(0, 10),
    //     lat: "12.97160000", // 8 decimal places for precision 10, scale 8
    //     long: "77.59460000", // 8 decimal places for precision 11, scale 8
    //     anniversary: new Date('2020-01-01').toISOString().slice(0, 10),
    //     relationshipStatus: 'single',
    //     expectations: 'Just testing',
    //     inviteCode: 'INVITE123',
    //     lang: 'en',
    //     distanceUnit: 'km',
    //     hideContent: false,
    //     locationPermission: true,
    //     mood: 'happy',
    //     isActive: true,
    //     lastActiveAt: null,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    // };
    const userData = [{
        uuid: "1",
        transactionId: "1001",
        socialId: "2001",
        name: 'N',
        birthDate: new Date('1990-01-01').toISOString().slice(0, 10), // "YYYY-MM-DD"
        lat: "12.97160000",
        long: "77.59460000",
        anniversary: new Date('2020-01-01').toISOString().slice(0, 10), // "YYYY-MM-DD"
        inviteCode: 'INVITE123',
        hideContent: false,
        locationPermission: true,
        isActive: true,
        lastActiveAt: null,
        createdAt: new Date(), // timestamp fields can stay as Date
        updatedAt: new Date(),
    }, {
        uuid: "2",
        transactionId: "1002",
        socialId: "2002",
        name: 'P',
        birthDate: new Date('1990-01-01').toISOString().slice(0, 10), // "YYYY-MM-DD"
        lat: "22.97160000",
        long: "87.59460000",
        anniversary: new Date('2020-01-01').toISOString().slice(0, 10), // "YYYY-MM-DD"
        inviteCode: 'INVITE124',
        hideContent: false,
        locationPermission: true,
        isActive: true,
        lastActiveAt: null,
        createdAt: new Date(), // timestamp fields can stay as Date
        updatedAt: new Date(),
    }];
    // Seed users
    let user = await db.insert(usersTable).values(userData).returning();
    let payload = {
        user1Id: user[0].id,
        user2Id: user[1].id,
        deleted: false
    };
    const relationship = await db.insert(relationshipsTable).values(payload).returning();
    
    // Seed categories based on data.csv
    const categoriesData = [
        {
            name: 'Never Have I Ever',
            description: '',
            icon: '',
            color: '',
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'This or That',
            description: '',
            icon: '',
            color: '',
            sortOrder: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Who Is More Likely To',
            description: '',
            icon: '',
            color: '',
            sortOrder: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Would You Rather',
            description: '',
            icon: '',
            color: '',
            sortOrder: 4,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Deep Conversations',
            description: '',
            icon: '',
            color: '',
            sortOrder: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Discuss Before',
            description: '',
            icon: '',
            color: '',
            sortOrder: 6,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Answer With photo',
            description: '',
            icon: '',
            color: '',
            sortOrder: 7,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(categoriesTable).values(categoriesData);

    // Seed topics based on topic.csv
    const topicsData = [
        {
            name: 'Icebreakers',
            description: '',
            icon: '',
            color: '',
            sortOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Us & Love',
            description: '',
            icon: '',
            color: '',
            sortOrder: 2,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Intimacy',
            description: '',
            icon: '',
            color: '',
            sortOrder: 3,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Moral Values',
            description: '',
            icon: '',
            color: '',
            sortOrder: 4,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Money & Finacnces',
            description: '',
            icon: '',
            color: '',
            sortOrder: 5,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Get to Know Each Other',
            description: '',
            icon: '',
            color: '',
            sortOrder: 6,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Adventures',
            description: '',
            icon: '',
            color: '',
            sortOrder: 7,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Family',
            description: '',
            icon: '',
            color: '',
            sortOrder: 8,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Work-life',
            description: '',
            icon: '',
            color: '',
            sortOrder: 9,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        },
        {
            name: 'Life Style',
            description: '',
            icon: '',
            color: '',
            sortOrder: 10,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
    ];

    await db.insert(topicsTable).values(topicsData);

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
        questionType: row.questionType === 'this_that' ? 'multiple_choice' : (row.questionType === 'he_she' ? 'multiple_choice' : (row.questionType === 'user_image' ? 'photo' : (row.questionType === 'user_text' ? 'text' : row.questionType))),
        optionText: row.optionText && row.optionText !== '' ? row.optionText : null,
        optionImg: row.optionImg && row.optionImg !== '' ? row.optionImg : null,
        sortOrder: row.id ? Number(row.id) : 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));

    if (questions.length !== 850) {
        throw new Error(`Expected 850 questions, found ${questions.length}`);
    }

    await db.insert(questionsTable).values(questions);
    console.log('Seeded', questions.length, 'questions!');
    console.log('Seeding complete!');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
