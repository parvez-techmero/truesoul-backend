// Test script to demonstrate the users seeder functionality
import { readUsersFromCSV, getDefaultUsers } from './seeder';

async function testUsersSeeder() {
    console.log('🧪 Testing Users Seeder...');
    console.log('==========================================');
    
    try {
        // Test reading from CSV
        console.log('1. Testing CSV reading...');
        const csvUsers = await readUsersFromCSV();
        console.log(`   ✅ Read ${csvUsers.length} users from CSV`);
        
        if (csvUsers.length > 0) {
            console.log('   📋 Sample user data:');
            console.log('      Name:', csvUsers[0].name);
            console.log('      UUID:', csvUsers[0].uuid);
            console.log('      Gender:', csvUsers[0].gender || 'Not specified');
            console.log('      Invite Code:', csvUsers[0].inviteCode);
            console.log('      Active:', csvUsers[0].isActive);
        }
        
        // Test default users
        console.log('\n2. Testing default users...');
        const defaultUsers = getDefaultUsers();
        console.log(`   ✅ Generated ${defaultUsers.length} default users`);
        
        console.log('\n==========================================');
        console.log('✅ All tests passed!');
        console.log('==========================================');
        
        // Summary
        console.log('\n📊 Summary:');
        console.log(`   • CSV users: ${csvUsers.length}`);
        console.log(`   • Default users: ${defaultUsers.length}`);
        console.log(`   • Total available: ${csvUsers.length || defaultUsers.length}`);
        
        return {
            csvUsers,
            defaultUsers,
            totalUsers: csvUsers.length || defaultUsers.length
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testUsersSeeder()
        .then(() => {
            console.log('\n🎉 Users seeder is ready to use!');
            console.log('   Run: npm run seed:users (to seed users only)');
            console.log('   Run: npm run seed (to seed all data including users)');
        })
        .catch((error) => {
            console.error('Test failed:', error);
            process.exit(1);
        });
}

export { testUsersSeeder };