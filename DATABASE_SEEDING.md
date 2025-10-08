# 🌱 Database Seeding Guide

## Quick Start

To seed your database with initial data, run:

```bash
npm run db:seed
```

---

## What Gets Seeded

The seeder populates your database with:

1. **Users** (from `src/lib/users.csv` if exists, or default data)
2. **Categories** 
3. **Topics**
4. **Sub-topics** (86 items from `src/lib/sub-topic.csv`)
   - Includes `adult` field classification
5. **Questions** (1215 items from `src/lib/Relationship App - questions.csv`)
6. **App Settings** (default configurations)

---

## ⚠️ Important Notes

### Running the Seeder

✅ **CORRECT WAY:**
```bash
# From project root
npm run db:seed
```

❌ **INCORRECT WAY:**
```bash
# Don't run directly from src/lib
cd src/lib
npx ts-node seeder.ts  # This won't load .env properly!
```

### Why?

The seeder needs to:
1. Load environment variables from `.env` in the project root
2. Connect to the correct database (`truesoul`)
3. Have access to all CSV files with correct relative paths

---

## Database Connection

The seeder uses the `DATABASE_URL` from your `.env` file:

```properties
DATABASE_URL=postgresql://postgres:12345678@localhost:5432/truesoul
```

**Before seeding**, ensure:
1. PostgreSQL is running
2. Database `truesoul` exists
3. Migrations are applied: `npm run db:push`

---

## Seeding Process

The seeder performs these steps:

1. **Truncates existing data** (with CASCADE)
   - Clears: `user_answers`, `questions`, `sub_topics`, `topics`, `categories`, `relationships`, `users`, `app_settings`
   - Resets auto-increment IDs

2. **Seeds users** from `src/lib/users.csv` (optional file)
   
3. **Seeds categories** (hardcoded data)

4. **Seeds topics** (hardcoded data)

5. **Seeds sub-topics** from `src/lib/sub-topic.csv`
   - Parses `adult` field (true/false/1/0)
   
6. **Seeds questions** from `src/lib/Relationship App - questions.csv`

7. **Seeds app settings** (default values)

---

## CSV File Requirements

### sub-topic.csv

Required columns:
- `id` - Sort order
- `topicId` - Foreign key to topics (optional)
- `categoryId` - Foreign key to categories (optional)
- `name` - Sub-topic name
- `description` - Description (optional)
- `icon` - Icon identifier (optional)
- `color` - Hex color code (optional)
- `adult` - Boolean (true/false/1/0) for adult content classification

Example:
```csv
id,topicId,categoryId,name,description,icon,color,adult
1,1,NULL,"Daily Life","Questions about daily life",icon.png,#FF5733,false
2,1,NULL,"Intimate Life","Adult content questions",icon.png,#C70039,true
```

### Relationship App - questions.csv

Required columns:
- `id` - Sort order
- `subTopicId` - Foreign key to sub_topics
- `questionText` - The question
- `questionType` - Type (yes_no, multiple_choice, etc.)
- `optionText` - Options for multiple choice (optional)
- `optionImg` - Image URL for options (optional)

---

## Troubleshooting

### Error: "relation 'sub_topics' does not exist"

**Cause:** Migrations not applied or connecting to wrong database

**Solution:**
```bash
# Apply migrations first
npm run db:push

# Then seed
npm run db:seed
```

### Error: Cannot find CSV files

**Cause:** Running seeder from wrong directory

**Solution:**
```bash
# Always run from project root
npm run db:seed
```

### Error: Database connection refused

**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Start PostgreSQL service
2. Check `.env` file has correct `DATABASE_URL`
3. Verify database `truesoul` exists

---

## Development Workflow

```bash
# 1. Make schema changes
# Edit src/db/schema.ts

# 2. Generate migration
npm run db:generate

# 3. Apply migration
npm run db:push

# 4. Seed with fresh data
npm run db:seed

# 5. Verify in Drizzle Studio
npm run db:studio
```

---

## Production Considerations

### DO NOT run seeder in production!

The seeder:
- ❌ **TRUNCATES ALL DATA** - deletes everything
- ❌ **Resets auto-increment IDs** - breaks references
- ❌ **Uses test/development data** - not production-ready

For production, use proper migration scripts instead.

---

## Files

| File | Purpose |
|------|---------|
| `seed.ts` | Entry point (run from root) |
| `src/lib/seeder.ts` | Main seeding logic |
| `src/lib/users.csv` | Optional user data |
| `src/lib/sub-topic.csv` | Sub-topics data (86 items) |
| `src/lib/Relationship App - questions.csv` | Questions data (1215 items) |
| `package.json` | Contains `db:seed` script |

---

## Summary

✅ **Correct command:** `npm run db:seed`  
✅ **Run from:** Project root directory  
✅ **Before seeding:** Apply migrations (`npm run db:push`)  
✅ **Database:** Uses `.env` DATABASE_URL  
⚠️ **Warning:** Deletes all existing data!

---

## Success Output

When successful, you'll see:

```
🌱 Starting database seeding...
📦 Database URL: Loaded from .env
All tables emptied.
Seeded 86 sub-topics!
Seeded 1215 questions!
Seeding complete!
```

Now your database is ready with fresh data! 🎉
