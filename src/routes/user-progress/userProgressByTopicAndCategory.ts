import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { topicsTable, categoriesTable, subTopicsTable, questionsTable, userAnswersTable, usersTable } from '../../db/schema';
import { eq, or, and } from "drizzle-orm";

export class UserProgressByTopic extends OpenAPIRoute {
  schema = {
    tags: ["UserProgress"],
    summary: "Get user progress by topic",
    request: {
      query: z.object({
        userId: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Returns user progress for each topic",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.array(z.any()),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const db = c.get('db');
    const { query } = await this.getValidatedData<typeof this.schema>();
    const { userId } = query;

    try {
      const userIdNum = parseInt(userId);
      
      // Get user's hideContent setting
      const [user] = await db.select({ hideContent: usersTable.hideContent })
        .from(usersTable)
        .where(eq(usersTable.id, userIdNum));
      
      const topics = await db.select().from(topicsTable);
      const progress = await Promise.all(
        topics.map(async (topic) => {
          // Get all subtopics for this topic
          const conditions = [eq(subTopicsTable.topicId, topic.id)];
          
          // Filter adult content if user has hideContent enabled
          if (user?.hideContent) {
            conditions.push(eq(subTopicsTable.adult, false));
          }
          
          const subTopics = await db.select().from(subTopicsTable).where(and(...conditions));
          const subTopicIds = subTopics.map(st => st.id);

          // Get all questions for these subtopics
          let questions = [];
          if (subTopicIds.length > 0) {
            questions = await db.select().from(questionsTable).where(or(...subTopicIds.map(stid => eq(questionsTable.subTopicId, stid))));
          }
          const totalQuestions = questions.length;

          // Get all user answers for these questions
          const questionIds = questions.map(q => q.id);
          let answeredCount = 0;
          if (questionIds.length > 0) {
            const userAnswers = await db
              .select()
              .from(userAnswersTable)
              .where(and(
                eq(userAnswersTable.userId, parseInt(userId)),
                or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
              ));
            answeredCount = userAnswers.length;
          }

          const percent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

          return {
            topicId: topic.id,
            topicName: topic.name,
            topicIcon: topic.icon,
            totalQuestions,
            answeredCount,
            percent,
          };
        })
      );

      progress.pop()
      return c.json({ success: true, data: progress });
    } catch (err) {
      return c.json({ error: 'Failed to fetch user progress by topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}

export class UserProgressByCategory extends OpenAPIRoute {
  schema = {
    tags: ["UserProgress"],
    summary: "Get user progress by category",
    request: {
      query: z.object({
        userId: z.string(),
      }),
    },
    responses: {
      "200": {
        description: "Returns user progress for each category",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.array(z.any()),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const db = c.get('db');
    const { query } = await this.getValidatedData<typeof this.schema>();
    const { userId } = query;

    try {
      const userIdNum = parseInt(userId);
      
      // Get user's hideContent setting
      const [user] = await db.select({ hideContent: usersTable.hideContent })
        .from(usersTable)
        .where(eq(usersTable.id, userIdNum));
      
      const categories = await db.select().from(categoriesTable);
      const progress = await Promise.all(
        categories.map(async (category) => {
          // Get all subtopics for this category
          const conditions = [eq(subTopicsTable.categoryId, category.id)];
          
          // Filter adult content if user has hideContent enabled
          if (user?.hideContent) {
            conditions.push(eq(subTopicsTable.adult, false));
          }
          
          const subTopics = await db.select().from(subTopicsTable).where(and(...conditions));
          const subTopicIds = subTopics.map(st => st.id);

          // Get all questions for these subtopics
          let questions = [];
          if (subTopicIds.length > 0) {
            questions = await db.select().from(questionsTable).where(or(...subTopicIds.map(stid => eq(questionsTable.subTopicId, stid))));
          }
          const totalQuestions = questions.length;

          // Get all user answers for these questions
          const questionIds = questions.map(q => q.id);
          let answeredCount = 0;
          if (questionIds.length > 0) {
            const userAnswers = await db
              .select()
              .from(userAnswersTable)
              .where(and(
                eq(userAnswersTable.userId, parseInt(userId)),
                or(...questionIds.map(qid => eq(userAnswersTable.questionId, qid)))
              ));
            answeredCount = userAnswers.length;
          }

          const percent = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);

          return {
            categoryId: category.id,
            categoryName: category.name,
            categoryIcon: category.icon,
            totalQuestions,
            answeredCount,
            percent,
          };
        })
      );

      return c.json({ success: true, data: progress });
    } catch (err) {
      return c.json({ error: 'Failed to fetch user progress by category', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
