# Relationship Reconnection & Validation Fix

## Problem Statement
After implementing the disconnection check, the following issues were identified:
1. **Reconnection Issue**: When users reconnect after disconnecting, the `deleted` flag remained `true`
2. **Duplicate Relationships**: Users could create multiple relationships with the same partner
3. **Missing Validations**: No validation to prevent self-relationships or duplicate entries

## Solution Implemented

### 1. Relationship Creation Endpoints Enhanced

#### **A. Create Relationship** (`/api/relationships`)
**File**: `src/routes/relationship-endpoints/relationshipCreate.ts`

**New Features**:
- ✅ **Prevents self-relationships**: Users cannot create relationships with themselves
- ✅ **Checks for existing relationships**: Searches for relationships in both orders (user1-user2 and user2-user1)
- ✅ **Automatic reconnection**: If a deleted relationship exists, it reconnects instead of creating a new one
- ✅ **Prevents duplicates**: Returns error if an active relationship already exists
- ✅ **Sets startedAt**: Automatically sets relationship start time

**Logic Flow**:
```
1. Validate both users exist and are not deleted
2. Check if user1 == user2 (prevent self-relationship)
3. Check if relationship exists (user1 -> user2)
4. Check if relationship exists (user2 -> user1)
5. If exists and deleted: RECONNECT (set deleted=false, reset startedAt)
6. If exists and active: RETURN ERROR (409 Conflict)
7. If doesn't exist: CREATE NEW RELATIONSHIP
```

**Response Examples**:

**Case 1: New Relationship Created**
```json
{
  "success": true,
  "relationship": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": false,
    "startedAt": "2025-10-08T10:30:00.000Z",
    "createdAt": "2025-10-08T10:30:00.000Z",
    "updatedAt": "2025-10-08T10:30:00.000Z"
  },
  "message": "Relationship created successfully"
}
```

**Case 2: Relationship Reconnected**
```json
{
  "success": true,
  "relationship": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": false,
    "startedAt": "2025-10-08T10:30:00.000Z",  // NEW startedAt
    "createdAt": "2025-10-01T10:00:00.000Z",  // Original creation date
    "updatedAt": "2025-10-08T10:30:00.000Z"
  },
  "message": "Relationship reconnected successfully"
}
```

**Case 3: Duplicate Relationship**
```json
{
  "success": false,
  "error": "Relationship already exists",
  "relationship": { ... }
}
```
**HTTP Status**: 409 Conflict

**Case 4: Self-Relationship Attempt**
```json
{
  "success": false,
  "error": "Cannot create relationship with yourself"
}
```
**HTTP Status**: 400 Bad Request

---

#### **B. Create Relationship with Invite Code** (`/api/relationships/invite`)
**File**: `src/routes/relationship-endpoints/relationshipCreateWithInviteCode.ts`

**New Features**:
- ✅ **All features from Create Relationship endpoint**
- ✅ **Case-insensitive invite code matching**
- ✅ **Returns user details for both users**

**Logic Flow**:
```
1. Find user2 by invite code (case-insensitive)
2. Validate both users exist
3. Check if user1 == user2 (prevent self-relationship)
4. Check if relationship exists (bidirectional)
5. If exists and deleted: RECONNECT
6. If exists and active: RETURN ERROR (409 Conflict)
7. If doesn't exist: CREATE NEW RELATIONSHIP
```

**Response Example**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": false,
    "startedAt": "2025-10-08T10:30:00.000Z",
    "user1": {
      "id": 1,
      "name": "User One",
      "profileImg": "...",
      ...
    },
    "user2": {
      "id": 2,
      "name": "User Two",
      "profileImg": "...",
      ...
    }
  },
  "message": "Relationship created successfully"
}
```

---

### 2. Relationship Update Endpoint Enhanced

#### **Update Relationship** (`/api/relationships/:id`)
**File**: `src/routes/relationship-endpoints/relationshipUpdate.ts`

**New Features**:
- ✅ **Can update deleted status**: Allows toggling `deleted` flag
- ✅ **Automatic reconnection handling**: When setting `deleted=false`, automatically resets `startedAt`
- ✅ **Can update even deleted relationships**: No longer filters by `deleted=false`
- ✅ **Additional fields**: Can update `reason`, `startedAt`, `status`

**Request Body**:
```json
{
  "deleted": false,          // Optional: Reconnect/disconnect
  "status": "active",        // Optional: Custom status
  "reason": "Rekindling",    // Optional: Reason for change
  "startedAt": "2025-10-08"  // Optional: Custom start date
}
```

**Response Examples**:

**Case 1: Reconnecting a Relationship**
```json
{
  "success": true,
  "relationship": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": false,
    "startedAt": "2025-10-08T10:30:00.000Z",  // Auto-reset
    "updatedAt": "2025-10-08T10:30:00.000Z"
  },
  "message": "Relationship reconnected successfully"
}
```

**Case 2: Disconnecting a Relationship**
```json
{
  "success": true,
  "relationship": {
    "id": 1,
    "user1Id": 1,
    "user2Id": 2,
    "deleted": true,
    "reason": "Taking a break",
    "updatedAt": "2025-10-08T10:30:00.000Z"
  },
  "message": "Relationship updated successfully"
}
```

---

## Complete Validation Rules

### ✅ Implemented Validations

| Rule | Endpoint | Implementation |
|------|----------|----------------|
| No self-relationships | Create, Invite | `if (user1Id === user2Id)` check |
| No duplicate active relationships | Create, Invite | Check existing in both orders |
| Auto-reconnect deleted relationships | Create, Invite | Update instead of insert |
| Prevent multiple relationships | Create, Invite | Bidirectional existence check |
| Reset startedAt on reconnect | Create, Invite, Update | Auto-set when `deleted: false` |
| Update even deleted relationships | Update | Removed `deleted=false` filter |

---

## Database Behavior

### Relationship States

1. **New Relationship**
   ```sql
   INSERT INTO relationships (user1_id, user2_id, deleted, started_at)
   VALUES (1, 2, false, NOW());
   ```

2. **Disconnect**
   ```sql
   UPDATE relationships 
   SET deleted = true, updated_at = NOW()
   WHERE id = 1;
   ```

3. **Reconnect**
   ```sql
   UPDATE relationships 
   SET deleted = false, started_at = NOW(), updated_at = NOW()
   WHERE id = 1;
   ```

### Query Patterns

**Check for existing relationship (both orders)**:
```sql
SELECT * FROM relationships 
WHERE (user1_id = 1 AND user2_id = 2) 
   OR (user1_id = 2 AND user2_id = 1);
```

**Get active relationships**:
```sql
SELECT * FROM relationships WHERE deleted = false;
```

**Get all relationships (including deleted)**:
```sql
SELECT * FROM relationships;
```

---

## Testing Scenarios

### Scenario 1: Create New Relationship
```bash
POST /api/relationships
{
  "user1Id": 1,
  "user2Id": 2
}

Expected: 200 OK, new relationship created
```

### Scenario 2: Try Creating Duplicate
```bash
POST /api/relationships
{
  "user1Id": 1,
  "user2Id": 2
}

Expected: 409 Conflict, "Relationship already exists"
```

### Scenario 3: Try Creating with Reversed Order
```bash
POST /api/relationships
{
  "user1Id": 2,  # Reversed
  "user2Id": 1
}

Expected: 409 Conflict, "Relationship already exists"
```

### Scenario 4: Disconnect Relationship
```bash
PATCH /api/relationships/1
{
  "deleted": true,
  "reason": "Need space"
}

Expected: 200 OK, relationship marked as deleted
```

### Scenario 5: Reconnect via Create
```bash
POST /api/relationships
{
  "user1Id": 1,
  "user2Id": 2
}

Expected: 200 OK, "Relationship reconnected successfully"
Result: deleted = false, startedAt = NOW()
```

### Scenario 6: Reconnect via Update
```bash
PATCH /api/relationships/1
{
  "deleted": false
}

Expected: 200 OK, "Relationship reconnected successfully"
Result: deleted = false, startedAt = NOW()
```

### Scenario 7: Self-Relationship Prevention
```bash
POST /api/relationships
{
  "user1Id": 1,
  "user2Id": 1
}

Expected: 400 Bad Request, "Cannot create relationship with yourself"
```

### Scenario 8: Invite Code with Reconnection
```bash
POST /api/relationships/invite
{
  "user1Id": 1,
  "inviteCode": "ABC123"
}

# If deleted relationship exists with user who has inviteCode ABC123
Expected: 200 OK, "Relationship reconnected successfully"
```

---

## Frontend Integration

### Example Usage

```typescript
// Create or reconnect relationship
async function createRelationship(user1Id: number, user2Id: number) {
  const response = await fetch('/api/relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user1Id, user2Id })
  });
  
  const result = await response.json();
  
  if (response.ok) {
    if (result.message.includes('reconnected')) {
      showNotification('Welcome back! Relationship reconnected.');
    } else {
      showNotification('Relationship created successfully!');
    }
    return result.relationship;
  } else if (response.status === 409) {
    showError('You already have an active relationship with this user.');
  } else if (response.status === 400) {
    showError(result.error);
  }
}

// Disconnect relationship
async function disconnectRelationship(relationshipId: number, reason?: string) {
  const response = await fetch(`/api/relationships/${relationshipId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deleted: true, reason })
  });
  
  const result = await response.json();
  
  if (response.ok) {
    showNotification('Relationship ended.');
    return result.relationship;
  }
}

// Check relationship status
async function checkRelationshipStatus(relationshipId: number) {
  const response = await fetch(`/api/relationships/get?relationshipId=${relationshipId}`);
  const result = await response.json();
  
  if (result.data.isDisconnect) {
    return 'disconnected';
  } else {
    return 'connected';
  }
}
```

---

## Migration Guide

### For Existing Applications

**No database migration needed** - the implementation uses existing fields.

**Frontend Changes Required**:

1. **Handle reconnection messages**:
   ```typescript
   if (response.message?.includes('reconnected')) {
     // Show reconnection UI
   }
   ```

2. **Handle 409 Conflict errors**:
   ```typescript
   if (response.status === 409) {
     // Show "already exists" message
   }
   ```

3. **Use Update endpoint for reconnection**:
   ```typescript
   // Option 1: Use create endpoint (it will reconnect)
   POST /api/relationships
   
   // Option 2: Use update endpoint
   PATCH /api/relationships/:id { "deleted": false }
   ```

---

## API Reference Quick Guide

### Create/Reconnect Relationship

**Endpoint**: `POST /api/relationships`

**Request**:
```json
{
  "user1Id": 1,
  "user2Id": 2
}
```

**Success Responses**:
- `200 OK` - Created or reconnected
- `409 Conflict` - Already exists
- `400 Bad Request` - Invalid data
- `404 Not Found` - User not found

---

### Create/Reconnect with Invite Code

**Endpoint**: `POST /api/relationships/invite`

**Request**:
```json
{
  "user1Id": 1,
  "inviteCode": "ABC123"
}
```

**Success Responses**:
- Same as Create Relationship
- Includes user details in response

---

### Update/Reconnect Relationship

**Endpoint**: `PATCH /api/relationships/:id`

**Request**:
```json
{
  "deleted": false,  // or true to disconnect
  "reason": "Optional reason"
}
```

**Success Responses**:
- `200 OK` - Updated successfully
- `404 Not Found` - Relationship not found

---

## Summary

✅ **Fixed**: Reconnection now properly resets `deleted` flag and `startedAt`  
✅ **Fixed**: Duplicate relationships prevented (bidirectional check)  
✅ **Fixed**: Self-relationships prevented  
✅ **Added**: Automatic reconnection on create/invite  
✅ **Added**: Manual reconnection via update endpoint  
✅ **Added**: Proper validation and error messages  

---

**Last Updated**: October 8, 2025  
**Status**: ✅ Implemented and Ready for Testing
