# Quick Start Guide - Streak Relationship Endpoint

## 🚀 Endpoint Ready!

```
# For relationships (current month)
GET /api/streak/relationship?relationshipId={id}

# For single users (current month)
GET /api/streak/relationship?userId={id}

# With month filter (any month)
GET /api/streak/relationship?relationshipId={id}&month=01-2025
GET /api/streak/relationship?userId={id}&month=12-2024
```

## ✅ What You Get

All data needed for the streak screen shown in your image:

1. **Combined Streak Count** - "100 days" 
2. **User Profiles & Individual Streaks** - Gwen (2 days), Peter (100 days)
3. **Freeze Availability** - "0 available"
4. **Monthly Calendar** - August 2025 with activity indicators (or any month you specify!)
5. **Today's Status** - Whether both users opened the app
6. **🆕 Month Filter** - View streak data for any month (format: MM-YYYY)

## 🧪 Test It Now

```bash
# Start the server
npm run dev

# Test for a relationship (current month)
curl "http://localhost:3000/api/streak/relationship?relationshipId=1"

# Test for a single user (current month)
curl "http://localhost:3000/api/streak/relationship?userId=5"

# Test with month filter - January 2025
curl "http://localhost:3000/api/streak/relationship?relationshipId=1&month=01-2025"

# Test historical month - December 2024
curl "http://localhost:3000/api/streak/relationship?userId=5&month=12-2024"

# Or visit the API docs
# http://localhost:3000/docs
```

## 📱 Frontend Integration

```javascript
// Fetch streak data for a relationship
const response = await fetch(
  `${API_URL}/api/streak/relationship?relationshipId=${relationshipId}`
);
const { success, data } = await response.json();

// OR for a single user
const response = await fetch(
  `${API_URL}/api/streak/relationship?userId=${userId}`
);
const { success, data } = await response.json();

// Use in your UI
<h1>{data.currentStreak} days</h1>
<p>{data.message}</p>

{data.users.map(user => (
  <UserCard 
    name={user.name}
    profileImg={user.profileImg}
    streak={user.streakCount}
  />
))}

<FreezeCard available={data.freezeAvailable} />

<Calendar 
  month={data.calendar.month}
  year={data.calendar.year}
  days={data.calendar.days}
/>
```

## 📄 Documentation

- **Full API Docs**: `STREAK_RELATIONSHIP_README.md`
- **Implementation Details**: `STREAK_IMPLEMENTATION_SUMMARY.md`

## 🎯 Next Steps

1. Start your server
2. Test the endpoint with your actual relationship IDs
3. Integrate into your frontend
4. Style according to your design

That's it! The endpoint is production-ready. 🎉
