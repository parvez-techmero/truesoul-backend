# Users Seeder Documentation

## Overview
The Users Seeder is a comprehensive solution for seeding user data from CSV files into the TrueSoul backend database. It automatically handles CSV parsing, data validation, and batch insertion with support for fallback default users.

## Features

### ✨ Key Capabilities
- **CSV-based seeding**: Reads user data from `src/lib/users.csv`
- **Data validation**: Handles NULL values, boolean conversion, and data type validation
- **Batch processing**: Processes users in batches of 50 for optimal performance
- **Fallback support**: Uses default users if CSV is unavailable
- **Relationship creation**: Automatically creates relationships between first two users
- **Error handling**: Comprehensive error handling with detailed logging
- **Duplicate filtering**: Excludes deleted users from seeding

### 📁 Files Structure
```
src/lib/
├── seeder.ts              # Main seeder with users functionality
├── usersSeeder.ts         # Standalone users-only seeder
├── testUsersSeeder.ts     # Test script for validation
└── users.csv              # CSV data file with user records
```

## Usage

### 1. Full Database Seeding (includes users)
```bash
npm run seed
```
This runs the complete seeder which:
- Empties all database tables
- Seeds users from CSV
- Creates sample relationship between first two users
- Seeds categories, topics, subtopics, and questions

### 2. Users-Only Seeding
```bash
npm run seed:users
```
This runs only the users seeder without affecting other data.

### 3. Test the Seeder
```bash
npx ts-node src/lib/testUsersSeeder.ts
```
This runs validation tests without making database changes.

## CSV Data Format

The `users.csv` file expects the following columns:

| Column | Type | Description |
|--------|------|-------------|
| `id` | number | Original user ID (for reference) |
| `uuid` | string | Unique user identifier |
| `transactionId` | string | Transaction reference |
| `socialId` | string | Social media ID |
| `name` | string | User's name |
| `gender` | enum | 'male', 'female', 'other', 'prefer_not_to_say' |
| `birthDate` | date | YYYY-MM-DD format |
| `lat` | decimal | Latitude coordinate |
| `long` | decimal | Longitude coordinate |
| `anniversary` | date | Anniversary date |
| `relationshipStatus` | string | Current relationship status |
| `expectations` | text | User expectations |
| `inviteCode` | string | Unique invite code |
| `lang` | enum | Language preference (default: 'en') |
| `distanceUnit` | enum | 'km' or 'miles' (default: 'km') |
| `hideContent` | boolean | Content visibility setting |
| `locationPermission` | boolean | Location access permission |
| `mood` | string | Current mood status |
| `profileImg` | text | Profile image URL |
| `isActive` | boolean | Account active status |
| `lastActiveAt` | timestamp | Last activity timestamp |
| `createdAt` | timestamp | Account creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |
| `deleted` | boolean | Soft delete flag |

## Data Processing Logic

### 1. CSV Parsing
- Reads CSV with headers and automatic column mapping
- Handles NULL values and converts them to appropriate types
- Converts string booleans ('True'/'False') to actual booleans
- Parses timestamps into Date objects

### 2. Data Validation
- Filters out users marked as deleted (`deleted: true`)
- Handles missing or NULL values gracefully
- Validates enum values for gender, language, and distance unit
- Ensures required fields are present

### 3. Batch Processing
```typescript
const batchSize = 50;
for (let i = 0; i < usersData.length; i += batchSize) {
    const batch = usersData.slice(i, i + batchSize);
    const result = await db.insert(usersTable).values(batch).returning();
    insertedUsers.push(...result);
}
```

### 4. Relationship Creation
After seeding users, automatically creates a relationship between the first two users:
```typescript
if (users.length >= 2) {
    const payload = {
        user1Id: users[0].id,
        user2Id: users[1].id,
        deleted: false
    };
    await db.insert(relationshipsTable).values(payload).returning();
}
```

## Current CSV Data Summary

The current `users.csv` contains **9 total records**:
- **7 active users** (will be seeded)
- **2 deleted users** (will be skipped)

### Active Users Overview:
1. **N** - Basic test user with coordinates
2. **P** - Partner test user with coordinates  
3. **Deny** - Male user, Dating status
4. **Nairobi** - Female user with profile image
5. **Dep** - Male user, deleted (skipped)
6. **Err** - Male user, deleted (skipped)
7. **ronyy** - Multiple entries with same base data

## API Integration

The seeded users can be used with the new subtopic divisions API:

```bash
# Get user progress divisions
GET /api/user-progress/subtopic-divisions?userId=1&division=your_turn

# Test with seeded users
GET /api/user-progress/subtopic-divisions?userId=2&division=complete
```

## Error Handling

The seeder includes comprehensive error handling:
- **CSV not found**: Falls back to default users
- **Invalid CSV format**: Logs detailed error messages
- **Database errors**: Rolls back transactions and reports issues
- **Batch failures**: Continues processing remaining batches

## Logging Output

The seeder provides detailed logging:
```
🌱 Starting Users Seeder...
=====================================
Seeding users...
Successfully read 7 users from CSV
Seeding 7 users...
Inserted batch 1: 7 users
✅ Successfully seeded 7 users
✅ Created relationship between users 1 and 2
=====================================
```

## Dependencies

Required packages (already installed):
- `csv-parse`: CSV parsing functionality
- `drizzle-orm`: Database ORM operations
- `fs`: File system operations
- `path`: Path utilities

## Future Enhancements

Potential improvements:
1. **Data validation schema**: Add Zod validation for CSV data
2. **Progress tracking**: Add progress bars for large datasets
3. **Incremental seeding**: Support for adding new users without full reseed
4. **Data transformation**: Custom field mapping and transformation rules
5. **Backup creation**: Automatic backup before seeding operations

---

The Users Seeder is now ready for production use and can handle both development and production data seeding scenarios efficiently! 🎉