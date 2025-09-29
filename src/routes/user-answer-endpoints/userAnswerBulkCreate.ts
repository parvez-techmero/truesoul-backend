import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { userAnswersTable, usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class UserAnswerBulkCreate extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Bulk Create User Answers",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              userId: z.number(),
              topicId: z.number(),
              answer: z.array(z.object({
                questionId: z.number(),
                answer: z.string()
              }))
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created User Answers",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              userAnswers: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      // Check if user exists and is not deleted
      const user = await db.select().from(usersTable).where(
        and(
          eq(usersTable.id, body.userId),
          eq(usersTable.deleted, false)
        )
      );
      if (!user.length) {
        return c.json({ 
          success: false, 
          error: 'User not found' 
        }, 404);
      }
      // Prepare answers for bulk insert
      const answersToInsert = body.answer.map(a => ({
        userId: body.userId,
        questionId: a.questionId,
        answerText: a.answer,
        topicId: body.topicId
      }));
      const userAnswers = await db.insert(userAnswersTable).values(answersToInsert).returning();
      return c.json({ success: true, userAnswers });
    } catch (err) {
      return c.json({ error: 'Failed to create user answers', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
