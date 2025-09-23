import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { userAnswersTable, usersTable } from '../../db/schema';
import { answerStatusEnum } from '../../types';
import { eq, and } from 'drizzle-orm';

export class UserAnswerCreate extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Create User Answer",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              userId: z.number(),
              questionId: z.number(),
              answerText: z.string().optional(),
              answerStatus: answerStatusEnum.optional()
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created User Answer",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              userAnswer: z.any(),
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
      
      const userAnswer = await db.insert(userAnswersTable).values(body).returning();
      return c.json({ success: true, userAnswer: userAnswer[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create user answer', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
