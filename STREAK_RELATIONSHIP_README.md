# Relationship Streak Endpoint Documentation

## Overview
This endpoint provides comprehensive streak data for either a relationship (both users) or a single user, including individual streaks, combined streak (for relationships), calendar view, and freeze information - matching the design shown in the Streak Screen.

## Endpoint Details

### **GET** `/api/streak/relationship`

Get complete streak information for a relationship or single user including:
- Combined streak count
- Individual user streaks
- Monthly activity calendar
- Freeze availability
- Today's completion status

## Request

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationshipId | number | No* | The ID of the relationship to get streak data for |
| userId | number | No* | The ID of a single user to get streak data for |
| month | string | No | Month filter in MM-YYYY format (e.g., "01-2025" for January 2025). Defaults to current month. |

**Note:** Either `relationshipId` OR `userId` must be provided (not both).

### Example Requests

**For a relationship (current month):**
```bash
GET /api/streak/relationship?relationshipId=1
```

**For a single user (current month):**
```bash
GET /api/streak/relationship?userId=5
```

**For a relationship with month filter (January 2025):**
```bash
GET /api/streak/relationship?relationshipId=1&month=01-2025
```

**For a single user with month filter (December 2024):**
```bash
GET /api/streak/relationship?userId=5&month=12-2024
```

## Response

### Success Response (200 OK)

**For a Relationship (both users):**
```json
{
  "success": true,
  "data": {
    "currentStreak": 2,
    "message": "Complete today's challenge to level up your streak!",
    "users": [
      {
        "id": 1,
        "name": "Gwen",
        "profileImg": "/profile-images/user1.jpg",
        "streakCount": 2
      },
      {
        "id": 2,
        "name": "Peter",
        "profileImg": "/profile-images/user2.jpg",
        "streakCount": 100
      }
    ],
    "freezeAvailable": 0,
    "calendar": {
      "month": "August",
      "year": 2025,
      "days": [
        {
          "date": "2025-08-01",
          "dayOfMonth": 1,
          "dayOfWeek": "Mon",
          "user1Opened": true,
          "user2Opened": true,
          "bothOpened": true,
          "isToday": false,
          "isFuture": false
        },
        {
          "date": "2025-08-02",
          "dayOfMonth": 2,
          "dayOfWeek": "Tue",
          "user1Opened": false,
          "user2Opened": true,
          "bothOpened": false,
          "isToday": false,
          "isFuture": false
        }
        // ... more days
      ]
    },
    "todayCompleted": false
  }
}
```

**For a Single User:**
```json
{
  "success": true,
  "data": {
    "currentStreak": 15,
    "message": "Complete today's challenge to level up your streak!",
    "users": [
      {
        "id": 5,
        "name": "John",
        "profileImg": "/profile-images/user5.jpg",
        "streakCount": 15
      }
    ],
    "freezeAvailable": 0,
    "calendar": {
      "month": "August",
      "year": 2025,
      "days": [
        {
          "date": "2025-08-01",
          "dayOfMonth": 1,
          "dayOfWeek": "Mon",
          "user1Opened": true,
          "user2Opened": null,
          "bothOpened": true,
          "isToday": false,
          "isFuture": false
        },
        {
          "date": "2025-08-02",
          "dayOfMonth": 2,
          "dayOfWeek": "Tue",
          "user1Opened": false,
          "user2Opened": null,
          "bothOpened": false,
          "isToday": false,
          "isFuture": false
        }
        // ... more days
      ]
    },
    "todayCompleted": true
  }
}
```

### Response Fields

#### Root Level
| Field | Type | Description |
|-------|------|-------------|
| success | boolean | Whether the request was successful |
| data | object | Contains all streak data |

#### Data Object
| Field | Type | Description |
|-------|------|-------------|
| currentStreak | number | Combined streak (minimum of both users for relationships, individual streak for single user) |
| message | string | Motivational message about today's challenge |
| users | array | Array of user objects with their streak information (1 for single user, 2 for relationship) |
| freezeAvailable | number | Number of streak freezes available (1 per month) |
| calendar | object | Calendar data for the current month |
| todayCompleted | boolean | Whether user(s) opened the app today (both for relationships, single for individual) |

#### User Object
| Field | Type | Description |
|-------|------|-------------|
| id | number | User ID |
| name | string\|null | User's name |
| profileImg | string\|null | URL to user's profile image |
| streakCount | number | Individual user's streak count |

#### Calendar Object
| Field | Type | Description |
|-------|------|-------------|
| month | string | Current month name (e.g., "August") |
| year | number | Current year |
| days | array | Array of day objects for the entire month |

#### Day Object
| Field | Type | Description |
|-------|------|-------------|
| date | string | ISO date string (YYYY-MM-DD) |
| dayOfMonth | number | Day of the month (1-31) |
| dayOfWeek | string | Short day name (Mon, Tue, etc.) |
| user1Opened | boolean | Whether user 1 (or the single user) opened the app on this day |
| user2Opened | boolean\|null | Whether user 2 opened the app (null for single user mode) |
| bothOpened | boolean | For relationships: both users opened. For single user: same as user1Opened |
| isToday | boolean | Whether this is today's date |
| isFuture | boolean | Whether this date is in the future |

### Error Responses

#### 400 Bad Request - Missing both parameters
```json
{
  "success": false,
  "message": "Either relationshipId or userId must be provided"
}
```

#### 400 Bad Request - Invalid month format
```json
{
  "success": false,
  "message": "Invalid month format. Expected MM-YYYY"
}
```

#### 400 Bad Request - Invalid month value
```json
{
  "success": false,
  "message": "Invalid month or year value"
}
```

#### 404 Not Found - Relationship not found
```json
{
  "success": false,
  "message": "Relationship not found"
}
```

## How the Streak System Works

### Streak Calculation Logic

1. **Individual Streak**: Counts consecutive days a user has opened the app
   - Starts from today (or yesterday if not opened today)
   - Counts backwards through consecutive days
   - Breaks when a day without an app open is found

2. **Combined Streak**: Takes the minimum of both users' individual streaks
   - This ensures both partners are equally engaged
   - Example: If User 1 has 100 days and User 2 has 2 days, combined streak is 2 days

3. **Calendar View**: Shows activity for the entire current month
   - Green indicator when both users opened the app
   - Individual user indicators visible
   - Future dates marked as unavailable

### Freeze System

The freeze system allows users to protect their streak:
- Users get 1 freeze per month
- A freeze protects the streak if one day is missed
- Currently returns 0 (can be enhanced with freeze usage tracking table)

### Integration with App Opens

This endpoint works with the existing app open tracking:
- Uses `daily_app_opens` table for all calculations
- Each app open is recorded via `POST /api/streak/record-app-open`
- Only one app open per user per day is counted

## UI Implementation Guide

Based on the streak screen design, here's how to use the data:

### Top Section - Current Streak
```javascript
const { currentStreak, message, todayCompleted } = data;

// Display: "100 days" with fire emoji
<Text>{currentStreak} days</Text>
<Text>{message}</Text>
```

### User Streak Cards
```javascript
data.users.map(user => (
  <Card key={user.id}>
    <Avatar src={user.profileImg} />
    <Text>{user.name}</Text>
    <Text>{user.streakCount} days streak</Text>
  </Card>
))
```

### Freeze Section
```javascript
const { freezeAvailable } = data;

<Card>
  <Text>{freezeAvailable} available</Text>
  <Text>Freeze protects your streak. You get one every month.</Text>
</Card>
```

### Activity Calendar
```javascript
const { calendar } = data;

<Calendar month={calendar.month} year={calendar.year}>
  {calendar.days.map(day => (
    <Day
      key={day.date}
      number={day.dayOfMonth}
      user1Active={day.user1Opened}
      user2Active={day.user2Opened}
      isToday={day.isToday}
      isFuture={day.isFuture}
    />
  ))}
</Calendar>
```

## Example Usage

### Frontend Implementation
```typescript
// Fetch streak data for a relationship
async function getRelationshipStreak(relationshipId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/streak/relationship?relationshipId=${relationshipId}`
  );
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}

// Fetch streak data for a single user
async function getSingleUserStreak(userId: number) {
  const response = await fetch(
    `${API_BASE_URL}/api/streak/relationship?userId=${userId}`
  );
  const result = await response.json();
  
  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.message);
  }
}
```

### React Component Example
```tsx
import React, { useEffect, useState } from 'react';

function StreakScreen({ relationshipId }) {
  const [streakData, setStreakData] = useState(null);
  
  useEffect(() => {
    async function loadStreak() {
      const data = await getRelationshipStreak(relationshipId);
      setStreakData(data);
    }
    loadStreak();
  }, [relationshipId]);
  
  if (!streakData) return <Loading />;
  
  return (
    <div>
      <h1>{streakData.currentStreak} days</h1>
      <p>{streakData.message}</p>
      
      <div className="users">
        {streakData.users.map(user => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
      
      <div className="freeze">
        <p>{streakData.freezeAvailable} available</p>
      </div>
      
      <Calendar data={streakData.calendar} />
    </div>
  );
}
```

## Testing

### Using cURL
```bash
# Get streak for relationship ID 1
curl -X GET "http://localhost:3000/api/streak/relationship?relationshipId=1"

# Get streak for single user ID 5
curl -X GET "http://localhost:3000/api/streak/relationship?userId=5"
```

### Using Postman
1. Create a new GET request
2. URL: `http://localhost:3000/api/streak/relationship`
3. Add query parameter: `relationshipId` = `1`
4. Send request

## Related Endpoints

- `GET /api/streak/single-user?userId={userId}` - Get single user's weekly streak
- `POST /api/streak/record-app-open` - Record when a user opens the app

## Future Enhancements

1. **Freeze Management**
   - Add `streak_freezes` table to track freeze usage
   - Implement freeze activation logic
   - Add endpoint to use a freeze

2. **Streak Notifications**
   - Send push notification if streak is about to break
   - Remind users to open the app daily

3. **Streak Rewards**
   - Add milestone achievements (30 days, 100 days, 365 days)
   - Special badges for long streaks

4. **Historical Data**
   - View past months' calendars
   - Streak statistics and analytics

## Database Schema

This endpoint uses the following table:

### daily_app_opens
```sql
CREATE TABLE daily_app_opens (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opened_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Performance Considerations

- Each calendar day requires a separate database query
- For a 31-day month, this means ~31 queries per request
- Consider optimizing with:
  - Batch queries for the entire month
  - Caching results (especially for past days)
  - Database indexing on `user_id` and `opened_at`

## Notes

- The combined streak is calculated as the minimum of both users' individual streaks
- Calendar always shows the current month
- Freeze feature framework is in place but needs full implementation
- All dates are handled in the server's timezone
