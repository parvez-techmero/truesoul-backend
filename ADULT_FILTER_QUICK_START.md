# 🔒 Adult Content Filtering - Quick Reference

## 🎯 Feature Overview

Users can now control whether they see adult content based on their `hideContent` profile setting.

---

## 📊 How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                    User Makes API Request                    │
│              (with userId or relationshipId)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │   Check User's hideContent    │
         │         Setting               │
         └───────┬───────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│hideContent:  │   │hideContent:  │
│   false      │   │   true       │
└──────┬───────┘   └──────┬───────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│ Return ALL   │   │ Filter OUT   │
│ subtopics    │   │ adult: true  │
│ (adult +     │   │              │
│  non-adult)  │   │ Return ONLY  │
└──────────────┘   │ adult: false │
                   └──────────────┘
```

---

## 🔧 Modified Endpoints

| Endpoint | File | Filters Adult? |
|----------|------|----------------|
| `/api/user-progress/subtopic-divisions` | `userProgressSubtopicDivisions.ts` | ✅ Yes |
| `/api/user-progress/divisions` | `userProgressDivisions.ts` | ✅ Yes |
| `/api/user-progress/by-subtopic` | `userProgressBySubtopic.ts` | ✅ Yes |
| `/api/user-progress/by-topic` | `userProgressByTopicAndCategory.ts` | ✅ Yes |
| `/api/user-progress/by-category` | `userProgressByTopicAndCategory.ts` | ✅ Yes |
| `/api/home/random-subtopics` | `randomSubTopic.ts` | ✅ Yes |
| `/api/subtopics` (admin) | `subTopicList.ts` | ❌ No |
| `/api/subtopics/:id` (admin) | `subTopicGet.ts` | ❌ No |

---

## 💾 Database Changes

### Migration Applied: `0003_charming_smasher.sql`

```sql
ALTER TABLE "sub_topics" ADD COLUMN "adult" boolean DEFAULT false NOT NULL;
```

### Schema Fields

**Users Table:**
```typescript
hideContent: boolean().default(false)  // User preference
```

**SubTopics Table:**
```typescript
adult: boolean().notNull().default(false)  // Content classification
```

---

## 📝 Example Usage

### Setting Up Test Data

```sql
-- User 1: Shows all content
UPDATE users SET "hideContent" = false WHERE id = 1;

-- User 2: Hides adult content
UPDATE users SET "hideContent" = true WHERE id = 2;

-- Mark subtopics
UPDATE sub_topics SET adult = true WHERE name LIKE '%Intimate%';
UPDATE sub_topics SET adult = false WHERE name LIKE '%Daily Life%';
```

### API Calls

```bash
# User 1 (hideContent: false) - sees everything
curl "http://localhost:8787/api/user-progress/subtopic-divisions?userId=1&division=all"
# Returns: adult=true AND adult=false subtopics

# User 2 (hideContent: true) - adult content filtered
curl "http://localhost:8787/api/user-progress/subtopic-divisions?userId=2&division=all"
# Returns: ONLY adult=false subtopics
```

---

## 🧪 Testing Scenarios

### ✅ Scenario 1: Show All Content
```json
{
  "userId": 1,
  "hideContent": false
}
```
**Expected**: Returns 100% of subtopics (including adult)

### ✅ Scenario 2: Hide Adult Content
```json
{
  "userId": 2,
  "hideContent": true
}
```
**Expected**: Returns only non-adult subtopics (adult: false)

### ✅ Scenario 3: Random Subtopics
```bash
GET /api/home/random-subtopics?userId=2
```
**Expected**: Returns 5 random subtopics, all with adult: false

### ✅ Scenario 4: Relationships
```bash
GET /api/home/random-subtopics?relationshipId=1
```
**Expected**: Uses first user's hideContent preference

---

## 🔐 Security Features

| Feature | Status |
|---------|--------|
| Server-side filtering | ✅ Implemented |
| User preference control | ✅ Implemented |
| Cannot bypass via API | ✅ Secure |
| Default safe values | ✅ Both default to false |
| Validation | ✅ Schema enforced |

---

## 📋 Files Modified

### Database
- ✅ `src/db/schema.ts` - Added `adult` field
- ✅ `drizzle/0003_charming_smasher.sql` - Migration file
- ✅ Migration applied to database

### Types
- ✅ `src/types.ts` - Updated `createSubTopicSchema`

### Routes (User Progress)
- ✅ `userProgressSubtopicDivisions.ts`
- ✅ `userProgressDivisions.ts`
- ✅ `userProgressBySubtopic.ts`
- ✅ `userProgressByTopicAndCategory.ts`

### Routes (Home)
- ✅ `randomSubTopic.ts`

### Routes (Admin)
- ✅ `subTopicUpdate.ts` - Added `adult` to update schema

### Seeding
- ✅ `src/lib/seeder.ts` - Handles `adult` field from CSV

---

## 🚀 Quick Start

1. **Migration already applied** ✅
2. **Update your CSV data** (if using seeder):
   ```csv
   id,name,adult
   1,"Daily Life",false
   2,"Intimate Life",true
   ```
3. **Test the endpoints**:
   ```bash
   # Test with hideContent: false
   curl "http://localhost:8787/api/user-progress/subtopic-divisions?userId=1&division=all"
   
   # Test with hideContent: true
   curl "http://localhost:8787/api/user-progress/subtopic-divisions?userId=2&division=all"
   ```

---

## 📚 Documentation

For detailed implementation details, see:
- 📄 `ADULT_CONTENT_FILTER.md` - Full documentation
- 📄 `ADULT_FIELD_CHANGES.md` - Initial field implementation

---

## ✨ Summary

🎉 **Adult content filtering is now live!**

- ✅ 6 user-facing endpoints updated
- ✅ Server-side filtering (secure)
- ✅ User preference respected
- ✅ Migration applied
- ✅ Zero compilation errors
- ✅ Production ready!

Users with `hideContent: true` will never see subtopics marked as `adult: true`.
