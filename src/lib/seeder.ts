import { db } from './database';
import { usersTable, categoriesTable, topicsTable } from '../db/schema';

async function seed() {

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
    const userData = {
    uuid: "1",
    transactionId: "1001",
    socialId: "2001",
    name: 'Test User',
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
};
    // Seed users
    await db.insert(usersTable).values(userData);

    // Seed categories
    await db.insert(categoriesTable).values({
        name: 'General',
        description: 'General category',
        icon: 'icon-general',
        color: '#FF0000',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    // Seed topics
    await db.insert(topicsTable).values({
        name: 'Introduction',
        description: 'Intro topic',
        icon: 'icon-intro',
        color: '#00FF00',
        sortOrder: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    console.log('Seeding complete!');
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
