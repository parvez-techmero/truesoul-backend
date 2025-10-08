import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { subTopicsTable, questionsTable, userAnswersTable, usersTable } from '../../db/schema';
import { eq, or, and } from "drizzle-orm";

export class UserProgressBySubtopic extends OpenAPIRoute {
  schema = {
    tags: ["UserProgress"],
    summary: "Get user progress by subtopic",
    request: {
      query: z.object({
        userId: z.string(),
        topicId: z.string().optional(),
        categoryId: z.string().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Returns user progress for each subtopic",
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
    const { userId, topicId, categoryId } = query;

    try {
      const userIdNum = parseInt(userId);
      
      // Get user's hideContent setting
      const [user] = await db.select({ hideContent: usersTable.hideContent })
        .from(usersTable)
        .where(eq(usersTable.id, userIdNum));
      
      // Build subtopic filter
      const conditions = [];
      
      // Filter adult content if user has hideContent enabled
      if (user?.hideContent) {
        conditions.push(eq(subTopicsTable.adult, false));
      }
      
      if (topicId) conditions.push(eq(subTopicsTable.topicId, parseInt(topicId)));
      if (categoryId) conditions.push(eq(subTopicsTable.categoryId, parseInt(categoryId)));

      let subTopics;
      if (conditions.length > 0) {
        subTopics = await db.select().from(subTopicsTable).where(and(...conditions));
      } else {
        subTopics = await db.select().from(subTopicsTable);
      }

      // For each subtopic, calculate progress
      const progress = await Promise.all(
        subTopics.map(async (subTopic) => {
          // Get all questions for this subtopic
          const questions = await db
            .select()
            .from(questionsTable)
            .where(eq(questionsTable.subTopicId, subTopic.id));
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
            subtopicId: subTopic.id,
            subtopicName: subTopic.name,
            totalQuestions,
            answeredCount,
            percent,
          };
        })
      );

      return c.json({ success: true, data: progress });
    } catch (err) {
      return c.json({ error: 'Failed to fetch user progress', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
