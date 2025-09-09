import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { userAnswersTable } from '../../db/schema';
import { answerStatusEnum } from '../../types';

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
              answerOptionId: z.number().optional(),
              answerText: z.string().optional(),
              status: answerStatusEnum.optional(),
              timeTaken: z.number().optional(),
              isSkipped: z.boolean().optional(),
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
      const userAnswer = await db.insert(userAnswersTable).values(body).returning();
      return c.json({ success: true, userAnswer: userAnswer[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create user answer', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
