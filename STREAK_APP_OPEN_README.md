# Daily Streak Based on App Opens

## Overview
The streak tracking system now works based on when users open the app daily, rather than when they answer questions.

## Changes Made

### 1. Database Schema (`src/db/schema.ts`)
- Added new table `dailyAppOpensTable` to track when users open the app
- Fields:
  - `id`: Primary key
  - `userId`: Foreign key to users table
  - `openedAt`: Timestamp when app was opened

### 2. New Endpoint: Record App Open (`src/routes/streak-endpoints/recordAppOpen.ts`)
- **Endpoint**: `POST /api/streak/record-app-open`
- **Purpose**: Records when a user opens the app
- **Request Body**:
  ```json
  {
    "userId": 123
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "App open recorded successfully",
    "alreadyOpenedToday": false
  }
  ```
- **Logic**: 
  - Checks if user already opened the app today
  - If yes, returns `alreadyOpenedToday: true`
  - If no, records the app open and returns `alreadyOpenedToday: false`
  - Only one app open per day is recorded for streak purposes

### 3. Updated Endpoint: Get Streak (`src/routes/streak-endpoints/streakSingleUser.ts`)
- **Endpoint**: `GET /api/streak/single-user?userId=123`
- **Purpose**: Get user's weekly streak based on app opens
- **Changes**:
  - Now queries `dailyAppOpensTable` instead of `userAnswersTable`
  - Changed field name from `canAnswerToday` to `canOpenToday`
- **Response**:
  ```json
  {
    "success": true,
    "date": {
      "DailyStreak": true,
      "newStreakStarted": false,
      "dates": [
        {
          "date": "2025-10-06",
          "streak": true,
          "canOpenToday": false
        },
        {
          "date": "2025-10-07",
          "streak": false,
          "canOpenToday": true
        }
        // ... other days of the week
      ]
    }
  }
  ```
- **Fields Explained**:
  - `DailyStreak`: True if user opened app every day this week
  - `newStreakStarted`: True if streak restarted after a break
  - `streak`: True if user opened app on this specific day
  - `canOpenToday`: True if user hasn't opened app yet for this day

### 4. Route Registration (`src/openapi.ts`)
- Added import for `RecordAppOpenPost`
- Registered new endpoint: `POST /api/streak/record-app-open`
- Organized streak endpoints together

### 5. Database Migration
- Generated migration: `drizzle/0002_early_chimera.sql`
- Migration has been pushed to database
- Table `daily_app_opens` is now live

## How It Works

1. **User Opens App**: 
   - Frontend calls `POST /api/streak/record-app-open` with userId
   - Backend checks if user already opened app today
   - If first open today, records it in `daily_app_opens` table
   - Returns whether this was the first open today

2. **View Streak**:
   - Frontend calls `GET /api/streak/single-user?userId=123`
   - Backend checks all days in current week (Monday-Sunday)
   - For each day, checks if user opened app
   - Returns streak status for each day and overall week

3. **Daily Flag Logic**:
   - Each day has a `canOpenToday` flag
   - Flag is `true` if user hasn't opened app yet today
   - Flag is `false` if user already opened app today
   - Only the first app open each day counts for streak

## Testing

To test the new endpoints:

1. **Record an app open**:
   ```bash
   curl -X POST http://localhost:8787/api/streak/record-app-open \
     -H "Content-Type: application/json" \
     -d '{"userId": 1}'
   ```

2. **Get streak status**:
   ```bash
   curl http://localhost:8787/api/streak/single-user?userId=1
   ```

## Frontend Integration

The frontend should:
1. Call the `record-app-open` endpoint when the user opens the app
2. Use the `canOpenToday` flag to show if user has already opened app today
3. Display streak progress based on the `dates` array
4. Show overall streak status using `DailyStreak` field
