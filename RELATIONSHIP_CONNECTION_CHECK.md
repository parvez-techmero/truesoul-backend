# Relationship Connection Check Implementation

## Overview
This document describes the implementation of connection status checking across all relationship-related endpoints. When a relationship is disconnected (marked as `deleted: true`), the API now returns only the user's data without their partner's information.

## Implementation Summary

### Key Principle
**When `relationship.deleted === true`, only return the user's own data, not their partner's data.**

---

## Modified Endpoints

### 1. **Relationship Get** (`/api/relationships/get`)
**File**: `src/routes/relationship-endpoints/relationshipGet.ts`

**Changes**:
- Only fetches `user2` details if `relationship.deleted === false`
- Returns `user2: null` when relationship is disconnected
- Always includes `isDisconnect` flag in response

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": true,
    "user1": { "id": 1, "name": "User One", ... },
    "user2": null,  // null when disconnected
    "isDisconnect": true
  }
}
```

---

### 2. **Relationship List** (`/api/relationships`)
**File**: `src/routes/relationship-endpoints/relationshipList.ts`

**Changes**:
- Now includes user details for all relationships
- Only fetches user1 and user2 for connected relationships
- Includes `isDisconnect` flag for each relationship

**Response Structure**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user1Id": 1,
      "user2Id": 2,
      "deleted": false,
      "user1": { "id": 1, "name": "User One", ... },
      "user2": { "id": 2, "name": "User Two", ... },
      "isDisconnect": false
    }
  ]
}
```

---

### 3. **Streak Relationship** (`/api/streak/relationship`)
**File**: `src/routes/streak-endpoints/streakRelationship.ts`

**Changes**:
- Now fetches relationships including deleted ones to check connection status
- Sets `user2Id = null` if relationship is disconnected
- Treats disconnected relationships as single-user mode
- Returns `user2: null` in response when disconnected

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "currentStreak": 5,
    "message": "...",
    "user1": { "id": 1, "name": "User One", ... },
    "user2": null,  // null when disconnected
    "freezeAvailable": 0,
    "calendar": { ... },
    "todayCompleted": true
  }
}
```

---

### 4. **Result Get** (`/api/results/get`)
**File**: `src/routes/result-endpoints/resultGet.ts`

**Changes**:
- Checks `relationship.deleted` status
- Only includes user2 answers when relationship is connected
- Sets `user2Answer` and `user2img` to `null` when disconnected

**Response Structure**:
```json
{
  "success": true,
  "match": "75.50",
  "data": [
    {
      "questionId": 1,
      "question": "...",
      "user1Answer": "Yes",
      "user2Answer": null,  // null when disconnected
      "user1img": "path/to/image.jpg",
      "user2img": null  // null when disconnected
    }
  ],
  "subtopic": "Communication"
}
```

---

### 5. **Result Single** (`/api/results/single`)
**File**: `src/routes/result-endpoints/resultSingle.ts`

**Changes**:
- Checks `relationship.deleted` status
- Only includes user2 answer when relationship is connected
- Returns `user2: null` when disconnected

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "user1": { "userId": 1, "answerText": "Yes", ... },
    "user2": null  // null when disconnected
  }
}
```

---

### 6. **Home Screen** (`/api/home`)
**File**: `src/routes/home-endpoints/home.ts`

**Changes**:
- Checks `relationship.deleted` status
- Only fetches user2 details when relationship is connected
- Returns `null` for user2, daysTogether, and user2 streak when disconnected

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "user1": { "id": 1, "name": "User One", ... },
    "user2": null,  // null when disconnected
    "daysTogether": null,  // null when disconnected
    "memoriesCreated": 5,
    "specialDays": 3,
    "citiesVisited": 2,
    "countriesVisited": null,
    "questionAnsweredPercentage": 45,
    "dailyStreak": {
      "user1": 5,
      "user2": null  // null when disconnected
    }
  }
}
```

---

### 7. **Daily Questions** (`/api/home/daily-questions`)
**File**: `src/routes/home-endpoints/dailyQuestions.ts`

**Changes**:
- When using `relationshipId`: checks if relationship is deleted and only fetches user1 data if disconnected
- When using `userId`: only looks for active (non-deleted) relationships
- Returns `user2Answered: false` and `user2Answer: null` when disconnected

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "questionId": 1,
    "questionText": "...",
    "questionType": "user_text",
    "user1Answered": true,
    "user2Answered": false,  // false when disconnected
    "user1Answer": "My answer",
    "user2Answer": null  // null when disconnected
  }
}
```

---

### 8. **Random Subtopic** (`/api/home/random-subtopics`)
**File**: `src/routes/home-endpoints\randomSubTopic.ts`

**Changes**:
- Checks `relationship.deleted` status
- Only includes user2 in `userIds` array when relationship is connected
- Processes progress for single user when disconnected

**Behavior**:
- When disconnected: treats as single-user mode
- Only checks progress for user1
- Generates subtopic sets based on user1's progress only

---

## Endpoints Already Properly Implemented

These endpoints already check for `deleted: false` and don't need changes:

### 1. **User Progress Subtopic Divisions**
**File**: `src/routes/user-progress/userProgressSubtopicDivisions.ts`
- Already filters relationships with `eq(relationshipsTable.deleted, false)`
- Won't return partner data for disconnected relationships

### 2. **Journal Endpoints**
**Files**: `src/routes/journal-endpoints/*.ts`
- Already validate relationship with `eq(relationshipsTable.deleted, false)`
- Only work with active relationships

---

## Testing Guidelines

### Test Cases

#### 1. **Connected Relationship (deleted: false)**
```bash
# Should return both user1 and user2 data
GET /api/relationships/get?relationshipId=1
GET /api/streak/relationship?relationshipId=1
GET /api/results/get?relationshipId=1&subTopicId=1
GET /api/home?relationshipId=1
```

**Expected**: Full data for both users

#### 2. **Disconnected Relationship (deleted: true)**
```bash
# Should return only user1 data, user2 should be null
GET /api/relationships/get?relationshipId=1
GET /api/streak/relationship?relationshipId=1
GET /api/results/get?relationshipId=1&subTopicId=1
GET /api/home?relationshipId=1
```

**Expected**: 
- `user2: null`
- `user2Answer: null`
- `user2Answered: false`
- `daysTogether: null`
- Partner-related data should be null or excluded

#### 3. **Disconnect a Relationship**
```bash
# Mark relationship as deleted
UPDATE relationships SET deleted = true WHERE id = 1;
```

Then test all endpoints to verify partner data is no longer returned.

---

## Database Schema Reference

### Relationships Table
```sql
relationships (
  id INTEGER PRIMARY KEY,
  user1Id INTEGER NOT NULL,
  user2Id INTEGER NOT NULL,
  reason TEXT,
  startedAt TIMESTAMP,
  deleted BOOLEAN DEFAULT false NOT NULL,  -- Key field for connection status
  createdAt TIMESTAMP DEFAULT NOW() NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW() NOT NULL
)
```

**Key Field**: `deleted`
- `false` = Connected/Active relationship
- `true` = Disconnected relationship

---

## Frontend Integration

### Handling Disconnected Relationships

```typescript
// Example: Check if relationship is connected
interface RelationshipResponse {
  success: boolean;
  data: {
    id: number;
    user1: User;
    user2: User | null;  // null when disconnected
    isDisconnect: boolean;
  };
}

// Usage
const response = await fetch('/api/relationships/get?relationshipId=1');
const result: RelationshipResponse = await response.json();

if (result.data.isDisconnect) {
  // Show disconnected state UI
  console.log('Relationship is disconnected');
  console.log('User data:', result.data.user1);
  console.log('Partner data:', null); // Don't show partner data
} else {
  // Show connected state UI
  console.log('User 1:', result.data.user1);
  console.log('User 2:', result.data.user2);
}
```

---

## Security Considerations

1. **Privacy**: Disconnected relationships hide partner data for privacy
2. **Data Access**: Users can still see their own historical data
3. **Relationship History**: The relationship record still exists but partner data is not exposed
4. **Journal/Memories**: Shared content may still be accessible (verify with business requirements)

---

## Migration Notes

### For Existing Data
No database migration required. The implementation uses the existing `deleted` field in the `relationships` table.

### For Clients
- Update frontend to handle `null` user2 values
- Check `isDisconnect` flag to show appropriate UI
- Handle cases where partner data is missing

---

## Summary

All relationship endpoints now properly check the `deleted` status and only return partner data when the relationship is active (`deleted: false`). This ensures:

✅ **Privacy**: Partner data is hidden when disconnected  
✅ **Consistency**: All endpoints behave the same way  
✅ **Flexibility**: Single user and relationship modes work seamlessly  
✅ **Security**: No unauthorized access to ex-partner's data  

---

## Quick Reference Table

| Endpoint | Partner Data When Connected | Partner Data When Disconnected |
|----------|----------------------------|-------------------------------|
| `/api/relationships/get` | Full user2 object | `user2: null` |
| `/api/relationships` | Full user1 & user2 objects | Only user1 object |
| `/api/streak/relationship` | Both users' streaks | Only user1 streak |
| `/api/results/get` | user1Answer & user2Answer | Only user1Answer |
| `/api/results/single` | user1 & user2 answers | Only user1 answer |
| `/api/home` | Both users' data | Only user1 data |
| `/api/home/daily-questions` | Both users' answers | Only user1 answer |
| `/api/home/random-subtopics` | Progress for both users | Only user1 progress |

---

**Last Updated**: October 8, 2025  
**Status**: ✅ Implemented and Tested
