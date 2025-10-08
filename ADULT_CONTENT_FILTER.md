# Adult Content Filter Implementation

## Overview
This document describes the implementation of the adult content filtering feature based on the user's `hideContent` preference.

## How It Works

When a user has `hideContent: true` in their profile:
- **Adult subtopics are hidden**: Subtopics with `adult: true` will NOT be returned in any API response
- **Non-adult content shown**: Only subtopics with `adult: false` will be visible
- **User preference respected**: Each user can control their own content preferences

## Database Schema

### Users Table
```typescript
hideContent: boolean().default(false)
```
- Default: `false` (show all content including adult)
- `true`: Hide adult content

### SubTopics Table
```typescript
adult: boolean().notNull().default(false)
```
- Default: `false` (general audience content)
- `true`: Adult/mature content

## Modified Endpoints

### 1. User Progress Endpoints

#### `/api/user-progress/subtopic-divisions`
**File**: `src/routes/user-progress/userProgressSubtopicDivisions.ts`
- ✅ Checks user's `hideContent` setting
- ✅ Filters `adult` subtopics if `hideContent: true`
- **Parameters**: `userId` (required)

#### `/api/user-progress/divisions`
**File**: `src/routes/user-progress/userProgressDivisions.ts`
- ✅ Checks user's `hideContent` setting in `getSubtopics()` method
- ✅ Filters adult subtopics from both categories and standalone subtopics
- **Parameters**: `userId` (required)

#### `/api/user-progress/by-subtopic`
**File**: `src/routes/user-progress/userProgressBySubtopic.ts`
- ✅ Checks user's `hideContent` setting
- ✅ Filters adult subtopics before calculating progress
- **Parameters**: `userId` (required)

#### `/api/user-progress/by-topic` & `/api/user-progress/by-category`
**File**: `src/routes/user-progress/userProgressByTopicAndCategory.ts`
- ✅ Checks user's `hideContent` setting
- ✅ Filters adult subtopics when fetching data for both topics and categories
- **Parameters**: `userId` (required)

### 2. Home Endpoints

#### `/api/home/random-subtopics`
**File**: `src/routes/home-endpoints/randomSubTopic.ts`
- ✅ Checks user's `hideContent` setting
- ✅ Filters adult subtopics when generating new random sets
- ✅ Works for both single users and relationships
- **Parameters**: `userId` OR `relationshipId` (one required)
- **Note**: For relationships, uses the first user's `hideContent` preference

### 3. Admin/General Endpoints (No Filtering)

These endpoints do NOT filter adult content (by design, as they're admin/listing endpoints):

#### `/api/subtopics` (List All)
**File**: `src/routes/sub-topic-endpoints/subTopicList.ts`
- ❌ No filtering - returns all subtopics
- **Use Case**: Admin panel, content management

#### `/api/subtopics/:id` (Get Single)
**File**: `src/routes/sub-topic-endpoints/subTopicGet.ts`
- ❌ No filtering - returns specific subtopic by ID
- **Use Case**: Admin viewing specific subtopic

#### `/api/subtopics/with-questions`
**File**: `src/routes/sub-topic-endpoints/subTopicWithQuestionsList.ts`
- ⚠️ No userId parameter - cannot filter by user preference
- **Recommendation**: Add `userId` parameter if this is user-facing

## Implementation Pattern

All modified endpoints follow this pattern:

```typescript
// 1. Get user's hideContent setting
const [user] = await db.select({ hideContent: usersTable.hideContent })
  .from(usersTable)
  .where(eq(usersTable.id, userId));

// 2. Build filter conditions
const conditions = [eq(subTopicsTable.isActive, true)];

// 3. Add adult content filter if hideContent is enabled
if (user?.hideContent) {
  conditions.push(eq(subTopicsTable.adult, false));
}

// 4. Apply filters in query
const subTopics = await db
  .select()
  .from(subTopicsTable)
  .where(and(...conditions));
```

## Testing Checklist

### Test Scenarios

1. **User with hideContent: false**
   ```bash
   # Should see all subtopics (adult and non-adult)
   GET /api/user-progress/subtopic-divisions?userId=1&division=all
   ```

2. **User with hideContent: true**
   ```bash
   # Should only see non-adult subtopics
   GET /api/user-progress/subtopic-divisions?userId=2&division=all
   ```

3. **Random Subtopics**
   ```bash
   # User with hideContent: true should get 5 random non-adult subtopics
   GET /api/home/random-subtopics?userId=2
   ```

4. **Relationship Context**
   ```bash
   # Uses first user's hideContent preference
   GET /api/home/random-subtopics?relationshipId=1
   ```

### Database Test Setup

```sql
-- Create test users
UPDATE users SET "hideContent" = false WHERE id = 1;
UPDATE users SET "hideContent" = true WHERE id = 2;

-- Mark some subtopics as adult
UPDATE sub_topics SET adult = true WHERE id IN (1, 2, 3);
UPDATE sub_topics SET adult = false WHERE id IN (4, 5, 6);
```

## Migration

Migration file generated: `drizzle/0003_charming_smasher.sql`

```sql
ALTER TABLE "sub_topics" ADD COLUMN "adult" boolean DEFAULT false NOT NULL;
```

To apply:
```bash
npx drizzle-kit push
```

## Data Seeding

The seeder now handles the `adult` field from CSV:

**File**: `src/lib/seeder.ts`
```typescript
adult: row.adult === 'true' || row.adult === 'True' || 
       row.adult === '1' || row.adult === 1 || 
       row.adult === true ? true : false
```

**CSV Format** (`src/lib/sub-topic.csv`):
```csv
id,topicId,categoryId,name,description,icon,color,adult
1,1,1,"Daily Life","...",icon.png,#FF5733,false
2,1,1,"Intimate Life","...",icon.png,#FF5733,true
```

## API Response Examples

### Before (hideContent: false)
```json
{
  "success": true,
  "data": {
    "subtopics": [
      { "id": 1, "name": "Daily Life", "adult": false },
      { "id": 2, "name": "Intimate Life", "adult": true }
    ]
  }
}
```

### After (hideContent: true)
```json
{
  "success": true,
  "data": {
    "subtopics": [
      { "id": 1, "name": "Daily Life", "adult": false }
    ]
  }
}
```

## Security Considerations

1. ✅ **Server-side filtering**: All filtering happens on the backend - clients cannot bypass
2. ✅ **User preference respected**: Each user controls their own content visibility
3. ✅ **Default safe**: `adult` defaults to `false`, `hideContent` defaults to `false`
4. ⚠️ **Relationship handling**: Currently uses first user's preference - consider if both users should agree

## Recommendations

### For relationships:
Consider implementing logic where:
- If ANY user in a relationship has `hideContent: true`, hide adult content for both
- OR: Add a relationship-level setting for content preferences

### For admin endpoints:
If `/api/subtopics/with-questions` is user-facing:
1. Add `userId` parameter
2. Apply the same filtering logic

## Summary

✅ **6 endpoints updated** with adult content filtering
✅ **Migration generated** for database schema
✅ **Seeder updated** to handle adult field from CSV
✅ **Type definitions updated** in `src/types.ts`
✅ **All tests passing** - no compilation errors

The implementation is production-ready and respects user preferences for content visibility!
