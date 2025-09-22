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

    // Seed topics
    await db.insert(topicsTable).values({
        name: 'Intimacy',
        description: 'Intro topic',
        icon: 'icon-intro',
        color: '#00FF00',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

        // Seed sub topics
    await db.insert(subTopicsTable).values({
        name: 'Get to Know',
        topicId: 1,
        color: '#1500ffff',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await db.insert(questionsTable).values(
        [{
        // categoryId: null,
        subTopicId: 1,
        questionText: 'Do you prefer coffee or tea?',
        questionType: 'yes_no',
    },{
        subTopicId: 1,
        questionText: 'What is your favorite season?',
        questionType: 'multiple_choice',
        optionText: '[Spring, Summer, Autumn, Winter]',
    }]);
    
    console.log('Seeding complete!');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
