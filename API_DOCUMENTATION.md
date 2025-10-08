# User Progress APIs

## Overview
The User Progress APIs help track and organize user progress through categories, topics, and subtopics based on question completion status.

---

## 1. User Progress Divisions API (Categories & Subtopics)

### Overview
Returns both categories and subtopics organized by user progress status in a single response.

## Endpoint
```
GET /api/user-progress/divisions
```

## Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The ID of the user to calculate progress for |
| `division` | enum | Yes | Division type: `'all'`, `'your_turn'`, `'answered'`, `'completed'` |
| `categoryId` | string | No | Filter subtopics by specific category ID |
| `topicId` | string | No | Filter subtopics by specific topic ID |

## Division Types

- **`all`**: All categories and subtopics regardless of progress
- **`your_turn`**: Items with 0% progress (no questions answered)
- **`answered`**: Items with 1-99% progress (partially completed)  
- **`completed`**: Items with 100% progress (all questions answered)

## Response Format

```json
{
  "success": true,
  "data": {
    "division": "your_turn",
    "categories": [
      {
        "id": 1,
        "name": "Never Have I Ever",
        "description": "Fun conversation starters",
        "icon": "game",
        "color": "#FF6B6B",
        "totalQuestions": 25,
        "answeredCount": 0,
        "percent": 0,
        "progressStatus": "your_turn"
      }
    ],
    "subtopics": [
      {
        "id": 1,
        "topicId": 1,
        "categoryId": 1,
        "name": "Daily Life",
        "description": "Questions about everyday activities",
        "totalQuestions": 10,
        "answeredCount": 0,
        "percent": 0,
        "progressStatus": "your_turn"
      }
    ],
    "totalCount": {
      "categories": 1,
      "subtopics": 1,
      "total": 2
    },
    "filters": {
      "categoryId": null,
      "topicId": null
    }
  }
}
```

## Example API Calls

### Get all items for user
```
GET /api/user-progress/divisions?userId=123&division=all
```

### Get remaining items (your turn)
```
GET /api/user-progress/divisions?userId=123&division=your_turn
```

### Get completed items
```
GET /api/user-progress/divisions?userId=123&division=completed
```

### Get items with specific category filter
```
GET /api/user-progress/divisions?userId=123&division=all&categoryId=1
```

### Get items with both category and topic filters
```
GET /api/user-progress/divisions?userId=123&division=answered&categoryId=1&topicId=2
```

---

## 2. Subtopic Progress Divisions API (Relationship-Aware)

### Overview
Returns subtopics organized by progress status with relationship awareness. This API considers both user and partner progress to determine completion status.

### Endpoint
```
GET /api/user-progress/subtopic-divisions
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | The ID of the user to calculate progress for |
| `division` | enum | Yes | Division type: `'your_turn'`, `'answered'`, `'complete'`, `'all'` |
| `categoryId` | string | No | Filter subtopics by specific category ID |
| `topicId` | string | No | Filter subtopics by specific topic ID |

### Division Types (Relationship-Aware)

- **`your_turn`**: Subtopics where the user hasn't answered any questions yet
- **`answered`**: Subtopics where the user has answered some but not all questions
- **`complete`**: Subtopics where both user and partner (if in relationship) have answered ALL questions
- **`all`**: All subtopics regardless of progress

### Response Format

```json
{
  "success": true,
  "data": {
    "division": "complete",
    "subtopics": [
      {
        "id": 1,
        "name": "Daily Life",
        "description": "Questions about everyday activities",
        "icon": "daily",
        "color": "#4ECDC4",
        "topicId": 1,
        "categoryId": 1,
        "totalQuestions": 10,
        "userAnsweredCount": 10,
        "partnerAnsweredCount": 10,
        "userProgress": 100,
        "partnerProgress": 100,
        "overallProgress": 100,
        "status": "complete",
        "isCompleted": true
      }
    ],
    "summary": {
      "totalSubtopics": 25,
      "yourTurnCount": 8,
      "answeredCount": 12,
      "completeCount": 5
    },
    "relationship": {
      "hasPartner": true,
      "partnerId": 456,
      "partnerName": "Alex Smith"
    }
  }
}
```

### Key Features

1. **Relationship Awareness**: For users in relationships, "complete" status requires both users to answer all questions
2. **Individual Progress**: Shows separate progress for user and partner
3. **Summary Statistics**: Provides counts for each division type
4. **Flexible Filtering**: Support for category and topic filters

### Example API Calls

#### Get completed subtopics (both users finished)
```
GET /api/user-progress/subtopic-divisions?userId=123&division=complete
```

#### Get subtopics where it's user's turn
```
GET /api/user-progress/subtopic-divisions?userId=123&division=your_turn
```

#### Get partially answered subtopics in specific category
```
GET /api/user-progress/subtopic-divisions?userId=123&division=answered&categoryId=1
```

#### Get all subtopics in specific topic
```
GET /api/user-progress/subtopic-divisions?userId=123&division=all&topicId=2
```

### Error Responses

```json
{
  "error": "Failed to fetch subtopic divisions",
  "detail": "Database connection error"
}
```

## Features

- Returns both categories and subtopics in single API call
- Filters apply only to subtopics (categories are always unfiltered)
- Progress calculation includes all questions under categories/subtopics
- Automatic progress status classification
- Detailed count information for easy UI implementation