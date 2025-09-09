import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable } from '../../db/schema';
import { answerStatusEnum } from '../../types';
import { eq } from 'drizzle-orm';

export class UserAnswerUpdate extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Update User Answer",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              userId: z.number().optional(),
              questionId: z.number().optional(),
              answerOptionId: z.number().optional(),
              answerText: z.string().optional(),
              status: answerStatusEnum.optional(),
              timeTaken: z.number().optional(),
              isSkipped: z.boolean().optional(),
            }),
          },
        },
      },
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the updated User Answer",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              userAnswer: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "User Answer not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { body, params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const updated = await db.update(userAnswersTable).set(body).where(eq(userAnswersTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'User Answer not found' }, 404);
      }
      return c.json({ success: true, userAnswer: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update user answer', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
