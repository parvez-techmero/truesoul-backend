# User Data Structure Update - user1 and user2 Objects

## 🎯 Change Implemented

The streak endpoint response structure has been updated to provide user data as **separate `user1` and `user2` objects** instead of an array.

---

## 📊 New Response Structure

### Before (Array Format)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 9,
        "name": "Ronyyy",
        "profileImg": null,
        "streakCount": 1
      },
      {
        "id": 10,
        "name": null,
        "profileImg": null,
        "streakCount": 0
      }
    ]
  }
}
```

### After (Object Format) ✅
```json
{
  "success": true,
  "data": {
    "user1": {
      "id": 9,
      "name": "Ronyyy",
      "profileImg": null,
      "streakCount": 1
    },
    "user2": {
      "id": 10,
      "name": null,
      "profileImg": null,
      "streakCount": 0
    }
  }
}
```

---

## 🔄 Complete Response Example

### For Relationships
```json
{
  "success": true,
  "data": {
    "currentStreak": 1,
    "message": "Complete today's challenge to level up your streak!",
    "user1": {
      "id": 9,
      "name": "Ronyyy",
      "profileImg": null,
      "streakCount": 1
    },
    "user2": {
      "id": 10,
      "name": null,
      "profileImg": null,
      "streakCount": 0
    },
    "freezeAvailable": 0,
    "calendar": {
      "month": "October",
      "year": 2025,
      "days": [...]
    },
    "todayCompleted": false
  }
}
```

### For Single Users
```json
{
  "success": true,
  "data": {
    "currentStreak": 15,
    "message": "Complete today's challenge to level up your streak!",
    "user1": {
      "id": 5,
      "name": "John",
      "profileImg": "/profile-images/user5.jpg",
      "streakCount": 15
    },
    "user2": null,
    "freezeAvailable": 0,
    "calendar": {
      "month": "October",
      "year": 2025,
      "days": [...]
    },
    "todayCompleted": true
  }
}
```

---

## 💻 Frontend Updates Needed

### Old Code (Array Access)
```typescript
// ❌ This will no longer work
const users = data.users;
const user1 = users[0];
const user2 = users[1];

// ❌ This will fail
data.users.map(user => <UserCard user={user} />)
```

### New Code (Object Access)
```typescript
// ✅ New way to access users
const user1 = data.user1;
const user2 = data.user2;

// ✅ Render both users
<>
  <UserCard user={data.user1} />
  {data.user2 && <UserCard user={data.user2} />}
</>

// ✅ Check if it's a relationship
const isRelationship = data.user2 !== null;
```

---

## 🎨 UI Implementation Examples

### React/React Native Component
```typescript
function StreakScreen({ data }) {
  const { user1, user2, currentStreak, calendar } = data;
  const isRelationship = user2 !== null;
  
  return (
    <View>
      {/* Streak Count */}
      <Text>{currentStreak} days</Text>
      
      {/* User 1 Card */}
      <UserCard
        id={user1.id}
        name={user1.name}
        profileImg={user1.profileImg}
        streakCount={user1.streakCount}
      />
      
      {/* User 2 Card (if exists) */}
      {user2 && (
        <UserCard
          id={user2.id}
          name={user2.name}
          profileImg={user2.profileImg}
          streakCount={user2.streakCount}
        />
      )}
      
      {/* Calendar */}
      <Calendar
        month={calendar.month}
        year={calendar.year}
        days={calendar.days}
        showSecondUser={isRelationship}
      />
    </View>
  );
}
```

### TypeScript Interface
```typescript
interface StreakUser {
  id: number;
  name: string | null;
  profileImg: string | null;
  streakCount: number;
}

interface StreakData {
  currentStreak: number;
  message: string;
  user1: StreakUser;
  user2: StreakUser | null;
  freezeAvailable: number;
  calendar: {
    month: string;
    year: number;
    days: Array<{
      date: string;
      dayOfMonth: number;
      dayOfWeek: string;
      user1Opened: boolean;
      user2Opened: boolean | null;
      bothOpened: boolean;
      isToday: boolean;
      isFuture: boolean;
    }>;
  };
  todayCompleted: boolean;
}
```

### Conditional Rendering
```typescript
function UserProfilesSection({ data }) {
  return (
    <View>
      {/* Always show user1 */}
      <UserProfile
        name={data.user1.name || "User 1"}
        profileImg={data.user1.profileImg}
        streakCount={data.user1.streakCount}
      />
      
      {/* Only show user2 if it exists */}
      {data.user2 && (
        <UserProfile
          name={data.user2.name || "User 2"}
          profileImg={data.user2.profileImg}
          streakCount={data.user2.streakCount}
        />
      )}
      
      {/* Show message based on mode */}
      {data.user2 ? (
        <Text>Combined Streak: {data.currentStreak} days</Text>
      ) : (
        <Text>Your Streak: {data.currentStreak} days</Text>
      )}
    </View>
  );
}
```

---

## 🎯 Benefits of This Structure

1. **✅ More Explicit** - Clear distinction between user1 and user2
2. **✅ Type-Safe** - Easy to type in TypeScript
3. **✅ Consistent** - Always know which user is which
4. **✅ Null-Safe** - user2 can be explicitly null for single users
5. **✅ Easier Mapping** - Direct object access instead of array indexing
6. **✅ Better Documentation** - Schema clearly shows user1 and user2

---

## 📝 Field Descriptions

### user1 Object
| Field | Type | Description |
|-------|------|-------------|
| id | number | User ID |
| name | string\|null | User's name (null if not set) |
| profileImg | string\|null | Profile image URL (null if not uploaded) |
| streakCount | number | Individual user's streak count |

### user2 Object
| Field | Type | Description |
|-------|------|-------------|
| (entire object) | object\|null | **Null for single user mode** |
| id | number | User ID |
| name | string\|null | User's name (null if not set) |
| profileImg | string\|null | Profile image URL (null if not uploaded) |
| streakCount | number | Individual user's streak count |

---

## 🧪 Testing

### Test Relationship (Both Users)
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user1": { "id": 9, "name": "Ronyyy", "streakCount": 1 },
    "user2": { "id": 10, "name": null, "streakCount": 0 }
  }
}
```

### Test Single User
```bash
curl "http://localhost:3000/api/streak/relationship?userId=5"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "user1": { "id": 5, "name": "John", "streakCount": 15 },
    "user2": null
  }
}
```

---

## 🔄 Migration Guide

### Step 1: Update API Call Handlers
```typescript
// Before
fetch(url).then(res => res.json()).then(result => {
  const users = result.data.users; // ❌ Old way
});

// After
fetch(url).then(res => res.json()).then(result => {
  const { user1, user2 } = result.data; // ✅ New way
});
```

### Step 2: Update Component Props
```typescript
// Before
<StreakComponent users={data.users} /> // ❌

// After
<StreakComponent user1={data.user1} user2={data.user2} /> // ✅
```

### Step 3: Update TypeScript Types
```typescript
// Before
interface StreakData {
  users: User[]; // ❌
}

// After
interface StreakData {
  user1: User;
  user2: User | null; // ✅
}
```

---

## ✅ Complete

The user data structure has been updated to use `user1` and `user2` objects:
- ✅ Schema updated with proper types
- ✅ Backend logic updated to create user objects
- ✅ Response structure changed from array to objects
- ✅ user2 is nullable for single user mode
- ✅ No TypeScript errors
- ✅ Production ready

Test the new structure:
```bash
npm run dev
curl "http://localhost:3000/api/streak/relationship?relationshipId=1"
```
