import { pgTable, integer, varchar, text, boolean, timestamp, decimal, uuid, date, pgEnum } from 'drizzle-orm/pg-core';

// Enums for better data consistency
export const genderEnum = pgEnum('gender', ['male', 'female', 'other', 'prefer_not_to_say']);
export const relationshipStatusEnum = pgEnum('relationship_status', [
  'single', 'dating', 'in_relationship', 'engaged', 'married', 'divorced', 'widowed', 'complicated'
]);
export const languageEnum = pgEnum('language', ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']);
export const distanceUnitEnum = pgEnum('distance_unit', ['km', 'miles']);
export const questionTypeEnum = pgEnum('question_type', ['yes_no', 'multiple_choice', 'scale', 'text']);
export const answerStatusEnum = pgEnum('answer_status', ['correct', 'incorrect', 'skipped']);

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  uuid: varchar({ length: 100 }).notNull().unique(),
  transactionId: text(),
  socialId: text(),
  name: varchar({ length: 255 }).notNull(),
  gender: genderEnum(),
  birthDate: date(),
  lat: decimal({ precision: 10, scale: 8 }),
  long: decimal({ precision: 11, scale: 8 }),
  anniversary: date(),
  relationshipStatus: relationshipStatusEnum(),
  expectations: text(),
  inviteCode: varchar({ length: 100 }).unique(),
  lang: languageEnum().notNull().default('en'),
  distanceUnit: distanceUnitEnum().notNull().default('km'),
  hideContent: boolean().notNull().default(false),
  locationPermission: boolean().notNull().default(false),
  mood: varchar({ length: 100 }),
  isActive: boolean().notNull().default(true),
  lastActiveAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});


// Relationships between users (couples)
export const relationshipsTable = pgTable("relationships", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  user1Id: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  user2Id: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  status: varchar({ length: 50 }).notNull().default('pending'), // pending, accepted, blocked
  startedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Categories (Never Have I Ever, This or That, etc.)
export const categoriesTable = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  icon: varchar({ length: 100 }),
  color: varchar({ length: 50 }), // Hex color code
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Topics within categories (Icebreakers, Us & Love, etc.)
export const topicsTable = pgTable("topics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  // categoryId: integer().notNull().references(() => categoriesTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  icon: varchar({ length: 100 }),
  color: varchar({ length: 50 }),
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Sub-topics within topics (Daily Life, Our Intimate Life, etc.)
export const subTopicsTable = pgTable("sub_topics", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  topicId: integer().references(() => topicsTable.id, { onDelete: 'cascade' }),
  categoryId: integer().references(() => categoriesTable.id, { onDelete: 'cascade' }),
  name: varchar({ length: 255 }).notNull(),
  description: text(),
  icon: varchar({ length: 100 }),
  color: varchar({ length: 50 }),
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Questions
export const questionsTable = pgTable("questions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  subTopicId: integer().references(() => subTopicsTable.id),
  questionText: text().notNull(),
  questionType: questionTypeEnum().notNull().default('yes_no'),
  difficultyLevel: integer().notNull().default(1), // 1-5 scale
  sortOrder: integer().notNull().default(0),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Answer options for multiple choice questions
export const answerOptionsTable = pgTable("answer_options", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  questionId: integer().notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  optionText: varchar({ length: 500 }).notNull(),
  sortOrder: integer().notNull().default(0),
  isCorrect: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

// User answers to questions
export const userAnswersTable = pgTable("user_answers", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  questionId: integer().notNull().references(() => questionsTable.id, { onDelete: 'cascade' }),
  answerOptionId: integer().references(() => answerOptionsTable.id),
  answerText: text(), // For text-based answers
  answerValue: integer(), // For scale answers (1-10)
  isCorrect: boolean(),
  answerStatus: answerStatusEnum().notNull().default('correct'),
  timeSpentSeconds: integer(),
  answeredAt: timestamp().notNull().defaultNow(),
});

// Quiz sessions (when users take quizzes together)
export const quizSessionsTable = pgTable("quiz_sessions", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  relationshipId: integer().notNull().references(() => relationshipsTable.id, { onDelete: 'cascade' }),
  categoryId: integer().references(() => categoriesTable.id),
  topicId: integer().references(() => topicsTable.id),
  subTopicId: integer().references(() => subTopicsTable.id),
  totalQuestions: integer().notNull().default(0),
  completedQuestions: integer().notNull().default(0),
  user1Score: integer().notNull().default(0),
  user2Score: integer().notNull().default(0),
  status: varchar({ length: 50 }).notNull().default('active'), // active, completed, abandoned
  startedAt: timestamp().notNull().defaultNow(),
  completedAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// Individual question results within quiz sessions
export const quizResultsTable = pgTable("quiz_results", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  quizSessionId: integer().notNull().references(() => quizSessionsTable.id, { onDelete: 'cascade' }),
  questionId: integer().notNull().references(() => questionsTable.id),
  user1AnswerId: integer().references(() => userAnswersTable.id),
  user2AnswerId: integer().references(() => userAnswersTable.id),
  user1Correct: boolean(),
  user2Correct: boolean(),
  bothCorrect: boolean().notNull().default(false),
  createdAt: timestamp().notNull().defaultNow(),
});

// User progress tracking
export const userProgressTable = pgTable("user_progress", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  categoryId: integer().references(() => categoriesTable.id),
  topicId: integer().references(() => topicsTable.id),
  subTopicId: integer().references(() => subTopicsTable.id),
  totalQuestions: integer().notNull().default(0),
  answeredQuestions: integer().notNull().default(0),
  correctAnswers: integer().notNull().default(0),
  completionPercentage: decimal({ precision: 5, scale: 2 }).notNull().default('0.00'),
  lastAnsweredAt: timestamp(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// App settings/configuration
export const appSettingsTable = pgTable("app_settings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  key: varchar({ length: 100 }).notNull().unique(),
  value: text(),
  description: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

// User device tokens for push notifications
export const deviceTokensTable = pgTable("device_tokens", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  deviceToken: varchar({ length: 500 }).notNull(),
  deviceType: varchar({ length: 50 }).notNull(), // ios, android, web
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});


// export type Task = typeof tasks.$inferSelect;
// export type NewTask = typeof tasks.$inferInsert;
