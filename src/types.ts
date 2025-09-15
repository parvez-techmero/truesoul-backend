import { z } from "zod";

// Base schemas for common fields
const idSchema = z.number().int().positive();
const timestampSchema = z.date();
const uuidSchema = z.string().uuid();
const optionalStringSchema = z.string().optional();

// Enums
export const genderEnum = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export const relationshipStatusEnum = z.enum([
  'single', 'dating', 'in_relationship', 'engaged', 'married', 'divorced', 'widowed', 'complicated'
]);
export const languageEnum = z.enum(['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko']);
export const distanceUnitEnum = z.enum(['km', 'miles']);
export const questionTypeEnum = z.enum(['yes_no', 'multiple_choice', 'scale', 'text']);
export const answerStatusEnum = z.enum(['complete', 'skipped']);
export const quizStatusEnum = z.enum(['active', 'completed', 'abandoned']);
// export const relationshipConnectionStatusEnum = z.enum(['pending', 'accepted', 'blocked', 'declined']);

// ===============================
// USER SCHEMAS
// ===============================

export const createUserSchema = z.object({
  uuid: z.string(),
  transactionId: z.string(),
  socialId: z.string(),
  name: z.string().min(1, "Name is required").max(255),
  gender: genderEnum.optional(),
  birthDate: z.string().transform((str) => new Date(str)).optional(),
  lat: z.number().min(-90).max(90).optional(),
  long: z.number().min(-180).max(180).optional(),
  anniversary: z.string().transform((str) => new Date(str)).optional(),
  relationshipStatus: relationshipStatusEnum.optional(),
  expectations: z.string().optional(),
  lang: languageEnum.default('en'),
  distanceUnit: distanceUnitEnum.default('km'),
  hideContent: z.boolean().default(false),
  locationPermission: z.boolean().default(false),
  mood: z.string().max(100).optional(),
  inviteCode: z.string(),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = createUserSchema.partial();

export const userSchema = createUserSchema.extend({
  id: idSchema,
  lastActiveAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const loginUserSchema = z.object({
  email: z.string().email().default('user@example.com'),
  password: z.string().min(1, "Password is required").default('password123'),
});

export const userAuthResponseSchema = z.object({
  user: userSchema,
  token: z.string(),
  refreshToken: z.string(),
});

// ===============================
// RELATIONSHIP SCHEMAS
// ===============================

export const createRelationshipSchema = z.object({
  userId: idSchema,
  inviteCode: z.string().min(1, "Invite code is required"),
});

// export const updateRelationshipSchema = z.object({
//   status: relationshipConnectionStatusEnum,
// });

export const relationshipSchema = z.object({
  id: idSchema,
  user1Id: idSchema,
  user2Id: idSchema,
  startedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const relationshipWithUsersSchema = relationshipSchema.extend({
  user1: userSchema.optional(),
  user2: userSchema.optional(),
});

// ===============================
// CATEGORY SCHEMAS
// ===============================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(255),
  description: z.string().nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categorySchema = createCategorySchema.extend({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const categoryWithProgressSchema = categorySchema.extend({
  completionPercentage: z.number().min(0).max(100).default(0),
  totalQuestions: z.number().int().min(0).default(0),
  answeredQuestions: z.number().int().min(0).default(0),
});

// ===============================
// TOPIC SCHEMAS
// ===============================

export const createTopicSchema = z.object({
  //   categoryId: idSchema,
  name: z.string().min(1, "Topic name is required").max(255),
  description: z.string().optional(),
  icon: z.string().max(100).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateTopicSchema = createTopicSchema.partial()
// .omit({ categoryId: true });

export const topicSchema = createTopicSchema.extend({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const topicWithProgressSchema = topicSchema.extend({
  completionPercentage: z.number().min(0).max(100).default(0),
  totalQuestions: z.number().int().min(0).default(0),
  answeredQuestions: z.number().int().min(0).default(0),
});

export const topicWithCategorySchema = topicSchema.extend({
  category: categorySchema.optional(),
});

// ===============================
// SUB-TOPIC SCHEMAS
// ===============================

export const createSubTopicSchema = z.object({
  //   topicId: idSchema,
  categoryId: idSchema.nullable().optional(),
  topicId: idSchema.nullable().optional(),
  name: z.string().min(1, "Sub-topic name is required").max(255),
  description: z.string().nullable().optional(),
  icon: z.string().max(100).nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color").nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateSubTopicSchema = createSubTopicSchema.partial()
// .omit({ topicId: true });

export const subTopicSchema = createSubTopicSchema.extend({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const subTopicWithProgressSchema = subTopicSchema.extend({
  completionPercentage: z.number().min(0).max(100).default(0),
  totalQuestions: z.number().int().min(0).default(0),
  answeredQuestions: z.number().int().min(0).default(0),
});

// ===============================
// QUESTION SCHEMAS
// ===============================

export const createQuestionSchema = z.object({
  // categoryId: idSchema.nullable().optional(),
  // topicId: idSchema.nullable().optional(),
  subTopicId: idSchema.nullable().optional(),
  questionText: z.string().min(1, "Question text is required"),
  questionType: questionTypeEnum.default('yes_no'),
  optionText: z.string().max(500).nullable().optional(),
  optionImg: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const questionSchema = createQuestionSchema.extend({
  id: idSchema,
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

// export const answerOptionSchema = z.object({
//   id: idSchema,
//   questionId: idSchema,
//   optionText: z.string().max(500).nullable().optional(),
//   optionImg: z.string().nullable().optional(), // URL to image if applicable
//   sortOrder: z.number().int().min(0).default(0),
//   isCorrect: z.boolean().default(false),
//   createdAt: timestampSchema,
// });

// export const createAnswerOptionSchema = z.object({
//   questionId: idSchema,
//   optionText: z.string().min(1, "Option text is required").max(500).nullable().optional(),
//   optionImg: z.string().nullable().optional(),
//   sortOrder: z.number().int().min(0).default(0),
//   isCorrect: z.boolean().default(false),
// });

// export const questionWithOptionsSchema = questionSchema.extend({
//   answerOptions: z.array(answerOptionSchema).optional(),
// });

// ===============================
// QUIZ SESSION SCHEMAS
// ===============================

export const createQuizSessionSchema = z.object({
  relationshipId: idSchema,
  categoryId: idSchema.optional(),
  topicId: idSchema.optional(),
  subTopicId: idSchema.optional(),
  totalQuestions: z.number().int().min(1, "Must have at least 1 question"),
});

export const updateQuizSessionSchema = z.object({
  completedQuestions: z.number().int().min(0).optional(),
  user1Score: z.number().int().min(0).optional(),
  user2Score: z.number().int().min(0).optional(),
  status: quizStatusEnum.optional(),
  completedAt: timestampSchema.optional(),
});

export const quizSessionSchema = createQuizSessionSchema.extend({
  id: idSchema,
  completedQuestions: z.number().int().min(0).default(0),
  user1Score: z.number().int().min(0).default(0),
  user2Score: z.number().int().min(0).default(0),
  status: quizStatusEnum.default('active'),
  startedAt: timestampSchema,
  completedAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const quizSessionWithDetailsSchema = quizSessionSchema.extend({
  relationship: relationshipWithUsersSchema.optional(),
  category: categorySchema.optional(),
  topic: topicSchema.optional(),
  subTopic: subTopicSchema.optional(),
});

// ===============================
// USER ANSWER SCHEMAS
// ===============================

export const createUserAnswerSchema = z.object({
  userId: idSchema,
  questionId: idSchema,
  quizSessionId: idSchema.optional(),
  answerText: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export const userAnswerSchema = createUserAnswerSchema.extend({
  id: idSchema,
  answerStatus: answerStatusEnum.default('complete'),
  answeredAt: timestampSchema,
});

// export const userAnswerWithDetailsSchema = userAnswerSchema.extend({
//   user: userSchema.optional(),
//   question: questionWithOptionsSchema.optional(),
//   answerOption: answerOptionSchema.optional(),
// });

// ===============================
// QUIZ RESULT SCHEMAS
// ===============================

export const quizResultSchema = z.object({
  id: idSchema,
  quizSessionId: idSchema,
  questionId: idSchema,
  user1AnswerId: idSchema.optional(),
  user2AnswerId: idSchema.optional(),
  user1Correct: z.boolean().optional(),
  user2Correct: z.boolean().optional(),
  bothCorrect: z.boolean().default(false),
  createdAt: timestampSchema,
});

export const quizResultWithDetailsSchema = quizResultSchema.extend({
  // question: questionWithOptionsSchema.optional(),
  user1Answer: userAnswerSchema.optional(),
  user2Answer: userAnswerSchema.optional(),
});

// ===============================
// USER PROGRESS SCHEMAS
// ===============================

export const userProgressSchema = z.object({
  id: idSchema,
  userId: idSchema,
  categoryId: idSchema.optional(),
  topicId: idSchema.optional(),
  subTopicId: idSchema.optional(),
  totalQuestions: z.number().int().min(0).default(0),
  answeredQuestions: z.number().int().min(0).default(0),
  correctAnswers: z.number().int().min(0).default(0),
  completionPercentage: z.number().min(0).max(100).default(0),
  lastAnsweredAt: timestampSchema.optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const userProgressWithDetailsSchema = userProgressSchema.extend({
  category: categorySchema.optional(),
  topic: topicSchema.optional(),
  subTopic: subTopicSchema.optional(),
});

// ===============================
// QUERY PARAMETER SCHEMAS
// ===============================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const userQuerySchema = z.object({
  search: z.string().optional(),
  gender: genderEnum.optional(),
  relationshipStatus: relationshipStatusEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  lang: languageEnum.optional(),
}).merge(paginationSchema);

export const categoryQuerySchema = z.object({
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
}).merge(paginationSchema);

export const topicQuerySchema = z.object({
  categoryId: idSchema.optional(),
  isActive: z.coerce.boolean().optional(),
  search: z.string().optional(),
  userId: idSchema.optional(), // For progress tracking
}).merge(paginationSchema);

export const questionQuerySchema = z.object({
  categoryId: idSchema.optional(),
  topicId: idSchema.optional(),
  subTopicId: idSchema.optional(),
  questionType: questionTypeEnum.optional(),
  isActive: z.coerce.boolean().optional(),
  userId: idSchema.optional(), // To exclude answered questions
  randomize: z.coerce.boolean().default(false),
}).merge(paginationSchema);

export const quizSessionQuerySchema = z.object({
  relationshipId: idSchema.optional(),
  status: quizStatusEnum.optional(),
  categoryId: idSchema.optional(),
  topicId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).merge(paginationSchema);

export const userAnswerQuerySchema = z.object({
  userId: idSchema.optional(),
  questionId: idSchema.optional(),
  quizSessionId: idSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).merge(paginationSchema);

// ===============================
// DASHBOARD SCHEMAS
// ===============================

export const dashboardOverviewSchema = z.object({
  totalUsers: z.number().int().min(0),
  totalCouples: z.number().int().min(0),
  totalQuizzesTaken: z.number().int().min(0),
  totalQuestionsAnswered: z.number().int().min(0),
  averageQuizScore: z.number().min(0).max(100),
  activeQuizSessions: z.number().int().min(0),
});

export const dashboardUserGrowthSchema = z.object({
  period: z.string(),
  userCount: z.number().int().min(0),
  coupleCount: z.number().int().min(0),
});

export const dashboardCategoryStatsSchema = z.object({
  categoryName: z.string(),
  totalQuestions: z.number().int().min(0),
  totalAnswers: z.number().int().min(0),
  averageScore: z.number().min(0).max(100),
  popularityRank: z.number().int().min(1),
});

export const dashboardRecentActivitySchema = z.object({
  id: idSchema,
  type: z.enum(['quiz_started', 'quiz_completed', 'couple_connected', 'question_answered']),
  userId: idSchema,
  userName: z.string(),
  partnerName: z.string().optional(),
  categoryName: z.string().optional(),
  score: z.number().optional(),
  createdAt: z.string(), // ISO string
});

export const dashboardDataSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']),
  dateRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  overview: dashboardOverviewSchema,
  userGrowth: z.array(dashboardUserGrowthSchema),
  categoryStats: z.array(dashboardCategoryStatsSchema),
  recentActivity: z.array(dashboardRecentActivitySchema),
  topPerformingCouples: z.array(z.object({
    couple: z.string(),
    totalQuizzes: z.number().int(),
    averageScore: z.number(),
    lastActive: z.string(),
  })),
});

// ===============================
// APP SETTINGS SCHEMAS
// ===============================

export const appSettingSchema = z.object({
  id: idSchema,
  key: z.string().max(100),
  value: z.string().optional(),
  description: z.string().optional(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createAppSettingSchema = z.object({
  key: z.string().min(1, "Setting key is required").max(100),
  value: z.string().optional(),
  description: z.string().optional(),
});

export const updateAppSettingSchema = createAppSettingSchema.partial().omit({ key: true });

// ===============================
// DEVICE TOKEN SCHEMAS
// ===============================

export const deviceTokenSchema = z.object({
  id: idSchema,
  userId: idSchema,
  deviceToken: z.string().max(500),
  deviceType: z.enum(['ios', 'android', 'web']),
  isActive: z.boolean().default(true),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
});

export const createDeviceTokenSchema = z.object({
  userId: idSchema,
  deviceToken: z.string().min(1, "Device token is required").max(500),
  deviceType: z.enum(['ios', 'android', 'web']),
});

// ===============================
// VALIDATION HELPER FUNCTIONS
// ===============================

export const validateId = (id: unknown) => idSchema.parse(id);
export const validateUuid = (uuid: unknown) => uuidSchema.parse(uuid);
export const validateEmail = (email: string) => z.string().email().parse(email);
export const validateHexColor = (color: string) =>
  z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color format").parse(color);
export const validateCoordinates = (lat: number, long: number) => {
  z.number().min(-90).max(90).parse(lat);
  z.number().min(-180).max(180).parse(long);
};

// ===============================
// TYPE EXPORTS
// ===============================

// User types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UserAuthResponse = z.infer<typeof userAuthResponseSchema>;

// Relationship types
export type Relationship = z.infer<typeof relationshipSchema>;
export type CreateRelationship = z.infer<typeof createRelationshipSchema>;
// export type UpdateRelationship = z.infer<typeof updateRelationshipSchema>;
export type RelationshipWithUsers = z.infer<typeof relationshipWithUsersSchema>;

// Category types
export type Category = z.infer<typeof categorySchema>;
export type CreateCategory = z.infer<typeof createCategorySchema>;
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
export type CategoryWithProgress = z.infer<typeof categoryWithProgressSchema>;

// Topic types
export type Topic = z.infer<typeof topicSchema>;
export type CreateTopic = z.infer<typeof createTopicSchema>;
export type UpdateTopic = z.infer<typeof updateTopicSchema>;
export type TopicWithProgress = z.infer<typeof topicWithProgressSchema>;
export type TopicWithCategory = z.infer<typeof topicWithCategorySchema>;

// Sub-topic types
export type SubTopic = z.infer<typeof subTopicSchema>;
export type CreateSubTopic = z.infer<typeof createSubTopicSchema>;
export type UpdateSubTopic = z.infer<typeof updateSubTopicSchema>;
export type SubTopicWithProgress = z.infer<typeof subTopicWithProgressSchema>;

// Question types
export type Question = z.infer<typeof questionSchema>;
export type CreateQuestion = z.infer<typeof createQuestionSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
// export type QuestionWithOptions = z.infer<typeof questionWithOptionsSchema>;
// export type AnswerOption = z.infer<typeof answerOptionSchema>;
// export type CreateAnswerOption = z.infer<typeof createAnswerOptionSchema>;

// Quiz session types
export type QuizSession = z.infer<typeof quizSessionSchema>;
export type CreateQuizSession = z.infer<typeof createQuizSessionSchema>;
export type UpdateQuizSession = z.infer<typeof updateQuizSessionSchema>;
export type QuizSessionWithDetails = z.infer<typeof quizSessionWithDetailsSchema>;

// Answer types
export type UserAnswer = z.infer<typeof userAnswerSchema>;
export type CreateUserAnswer = z.infer<typeof createUserAnswerSchema>;
// export type UserAnswerWithDetails = z.infer<typeof userAnswerWithDetailsSchema>;

// Quiz result types
export type QuizResult = z.infer<typeof quizResultSchema>;
export type QuizResultWithDetails = z.infer<typeof quizResultWithDetailsSchema>;

// Progress types
export type UserProgress = z.infer<typeof userProgressSchema>;
export type UserProgressWithDetails = z.infer<typeof userProgressWithDetailsSchema>;

// Query types
export type PaginationQuery = z.infer<typeof paginationSchema>;
export type UserQuery = z.infer<typeof userQuerySchema>;
export type CategoryQuery = z.infer<typeof categoryQuerySchema>;
export type TopicQuery = z.infer<typeof topicQuerySchema>;
export type QuestionQuery = z.infer<typeof questionQuerySchema>;
export type QuizSessionQuery = z.infer<typeof quizSessionQuerySchema>;
export type UserAnswerQuery = z.infer<typeof userAnswerQuerySchema>;

// Dashboard types
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type DashboardUserGrowth = z.infer<typeof dashboardUserGrowthSchema>;
export type DashboardCategoryStats = z.infer<typeof dashboardCategoryStatsSchema>;
export type DashboardRecentActivity = z.infer<typeof dashboardRecentActivitySchema>;
export type DashboardData = z.infer<typeof dashboardDataSchema>;

// Settings types
export type AppSetting = z.infer<typeof appSettingSchema>;
export type CreateAppSetting = z.infer<typeof createAppSettingSchema>;
export type UpdateAppSetting = z.infer<typeof updateAppSettingSchema>;

// Device token types
export type DeviceToken = z.infer<typeof deviceTokenSchema>;
export type CreateDeviceToken = z.infer<typeof createDeviceTokenSchema>;