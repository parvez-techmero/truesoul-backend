# Month/Year Filter Feature for Streak Endpoint

## 🎯 New Feature Added

The streak endpoint now supports **month and year filtering** to view historical streak data for any month!

---

## 📝 Query Parameter

### `month` (optional)
- **Format:** `MM-YYYY` (e.g., `01-2025` for January 2025)
- **Description:** Filters the calendar to show streak data for a specific month
- **Default:** Current month if not provided
- **Examples:**
  - `01-2025` = January 2025
  - `12-2024` = December 2024
  - `06-2023` = June 2023

---

## 🚀 Usage Examples

### View Current Month (Default Behavior)
```bash
# For a relationship
GET /api/streak/relationship?relationshipId=1

# For a single user
GET /api/streak/relationship?userId=5
```

### View Specific Month - January 2025
```bash
# For a relationship
GET /api/streak/relationship?relationshipId=1&month=01-2025

# For a single user
GET /api/streak/relationship?userId=5&month=01-2025
```

### View December 2024
```bash
GET /api/streak/relationship?relationshipId=1&month=12-2024
```

### View Any Historical Month
```bash
# June 2023
GET /api/streak/relationship?relationshipId=1&month=06-2023

# March 2024
GET /api/streak/relationship?userId=5&month=03-2024
```

---

## 📊 Response Structure

The response structure remains the same, but the calendar will show data for the requested month:

```json
{
  "success": true,
  "data": {
    "currentStreak": 15,
    "message": "Complete today's challenge to level up your streak!",
    "users": [...],
    "freezeAvailable": 0,
    "calendar": {
      "month": "January",        // ← Month name for the filtered month
      "year": 2025,               // ← Year for the filtered month
      "days": [
        {
          "date": "2025-01-01",   // ← Dates from the requested month
          "dayOfMonth": 1,
          "dayOfWeek": "Wed",
          "user1Opened": true,
          "user2Opened": true,
          "bothOpened": true,
          "isToday": false,
          "isFuture": false
        },
        // ... all days of January 2025
      ]
    },
    "todayCompleted": false
  }
}
```

---

## ⚠️ Error Handling

### Invalid Format
```bash
GET /api/streak/relationship?relationshipId=1&month=2025-01
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid month format. Expected MM-YYYY"
}
```

### Invalid Month Value
```bash
GET /api/streak/relationship?relationshipId=1&month=13-2025
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid month or year value"
}
```

### Invalid Characters
```bash
GET /api/streak/relationship?relationshipId=1&month=ab-cdef
```
**Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid month or year value"
}
```

---

## 💻 Frontend Integration

### React/React Native Example

```typescript
interface StreakParams {
  relationshipId?: number;
  userId?: number;
  month?: string; // Format: "MM-YYYY"
}

async function fetchStreak({ relationshipId, userId, month }: StreakParams) {
  const params = new URLSearchParams();
  
  if (relationshipId) params.append('relationshipId', relationshipId.toString());
  if (userId) params.append('userId', userId.toString());
  if (month) params.append('month', month);
  
  const response = await fetch(
    `${API_URL}/api/streak/relationship?${params.toString()}`
  );
  
  const result = await response.json();
  return result;
}

// Usage examples:
// Current month
await fetchStreak({ relationshipId: 1 });

// January 2025
await fetchStreak({ relationshipId: 1, month: "01-2025" });

// December 2024
await fetchStreak({ userId: 5, month: "12-2024" });
```

### Month Selector Component

```typescript
import React, { useState } from 'react';

function StreakCalendar({ relationshipId, userId }) {
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>();
  const [streakData, setStreakData] = useState(null);
  
  // Load streak data
  useEffect(() => {
    fetchStreak({ relationshipId, userId, month: selectedMonth })
      .then(result => {
        if (result.success) {
          setStreakData(result.data);
        }
      });
  }, [relationshipId, userId, selectedMonth]);
  
  // Navigate to previous month
  const goToPreviousMonth = () => {
    const current = selectedMonth 
      ? parseMonth(selectedMonth)
      : new Date();
    
    const prev = new Date(current.getFullYear(), current.getMonth() - 1, 1);
    setSelectedMonth(formatMonth(prev)); // "MM-YYYY"
  };
  
  // Navigate to next month
  const goToNextMonth = () => {
    const current = selectedMonth 
      ? parseMonth(selectedMonth)
      : new Date();
    
    const next = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    setSelectedMonth(formatMonth(next)); // "MM-YYYY"
  };
  
  // Back to current month
  const goToCurrentMonth = () => {
    setSelectedMonth(undefined);
  };
  
  return (
    <View>
      <MonthNavigator
        month={streakData?.calendar.month}
        year={streakData?.calendar.year}
        onPrevious={goToPreviousMonth}
        onNext={goToNextMonth}
        onCurrent={goToCurrentMonth}
      />
      
      <Calendar days={streakData?.calendar.days} />
    </View>
  );
}

// Helper functions
function formatMonth(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${year}`;
}

function parseMonth(monthStr: string): Date {
  const [month, year] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1);
}
```

---

## 🎨 UI/UX Considerations

### Display Current vs Historical Months

```typescript
function StreakScreen({ data, selectedMonth }) {
  const isCurrentMonth = !selectedMonth; // No month filter = current month
  const today = new Date();
  
  return (
    <View>
      {/* Show different messages based on current vs historical */}
      {isCurrentMonth ? (
        <Text>Your current streak: {data.currentStreak} days</Text>
      ) : (
        <Text>
          Streak in {data.calendar.month} {data.calendar.year}: 
          {data.currentStreak} days
        </Text>
      )}
      
      {/* Show "Today" indicator only for current month */}
      <Calendar 
        days={data.calendar.days}
        highlightToday={isCurrentMonth}
      />
      
      {/* Show completion prompt only for current month */}
      {isCurrentMonth && !data.todayCompleted && (
        <Text>Complete today's challenge to continue your streak!</Text>
      )}
    </View>
  );
}
```

---

## 📅 Month Format Details

### Valid Formats
- ✅ `01-2025` (January 2025)
- ✅ `12-2024` (December 2024)
- ✅ `06-2023` (June 2023)

### Invalid Formats
- ❌ `2025-01` (Wrong order - year first)
- ❌ `1-2025` (Single digit month without leading zero)
- ❌ `01/2025` (Wrong separator - use dash)
- ❌ `January-2025` (Month name not allowed)
- ❌ `13-2025` (Invalid month - must be 01-12)

---

## 🧪 Testing

### Test Current Month (Default)
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1"
```
**Expected:** Calendar for current month (October 2025)

### Test Specific Month
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=01-2025"
```
**Expected:** Calendar for January 2025

### Test Historical Month
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=12-2024"
```
**Expected:** Calendar for December 2024

### Test Invalid Format
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=2025-01"
```
**Expected:** 400 error - "Invalid month format. Expected MM-YYYY"

### Test Invalid Month
```bash
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=13-2025"
```
**Expected:** 400 error - "Invalid month or year value"

---

## 🔍 Use Cases

### 1. **View Historical Streaks**
Users can see their streak performance from previous months:
```bash
GET /api/streak/relationship?userId=5&month=06-2024
```

### 2. **Compare Monthly Performance**
Frontend can fetch multiple months and compare:
```typescript
const jan = await fetchStreak({ relationshipId: 1, month: "01-2025" });
const feb = await fetchStreak({ relationshipId: 1, month: "02-2025" });
const mar = await fetchStreak({ relationshipId: 1, month: "03-2025" });
```

### 3. **Month Navigation**
Users can browse through months with prev/next buttons:
```typescript
<MonthPicker
  currentMonth={selectedMonth}
  onPrevious={() => navigateToMonth(-1)}
  onNext={() => navigateToMonth(1)}
/>
```

### 4. **Anniversary Check**
Check streak on a specific anniversary month:
```bash
GET /api/streak/relationship?relationshipId=1&month=02-2024
```

---

## 📖 API Documentation

### Full Endpoint Signature
```
GET /api/streak/relationship
```

### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| relationshipId | number | No* | Relationship ID |
| userId | number | No* | User ID (for single users) |
| month | string | No | Month filter (MM-YYYY format). Defaults to current month. |

**Note:** Either `relationshipId` OR `userId` must be provided.

### Example Requests

**Current month for relationship:**
```bash
GET /api/streak/relationship?relationshipId=1
```

**January 2025 for relationship:**
```bash
GET /api/streak/relationship?relationshipId=1&month=01-2025
```

**December 2024 for single user:**
```bash
GET /api/streak/relationship?userId=5&month=12-2024
```

---

## ✨ Benefits

1. **📊 Historical Analysis** - View streak data from any past month
2. **📅 Monthly Reports** - Generate monthly performance reports
3. **🔍 Pattern Discovery** - Identify streak patterns over time
4. **💪 Motivation** - See progress across multiple months
5. **🎯 Goal Tracking** - Track monthly streak goals
6. **📈 Trend Analysis** - Analyze long-term consistency

---

## 🚀 Ready to Use!

The month filter feature is now live and ready to use:
- ✅ Supports any month in MM-YYYY format
- ✅ Proper error handling for invalid formats
- ✅ Works with both relationship and single user modes
- ✅ Backward compatible (defaults to current month)
- ✅ Production ready!

Start testing with:
```bash
npm run dev
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=01-2025"
```
