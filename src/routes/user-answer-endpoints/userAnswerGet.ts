import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class UserAnswerGet extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Fetch User Answer by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the User Answer",
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
    const { params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const userAnswer = await db.select().from(userAnswersTable).where(eq(userAnswersTable.id, params.id));
      if (!userAnswer.length) {
        return c.json({ success: false, message: 'User Answer not found' }, 404);
      }
      return c.json({ success: true, userAnswer: userAnswer[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch user answer', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
