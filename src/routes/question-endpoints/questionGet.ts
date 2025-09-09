import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { questionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class QuestionGet extends OpenAPIRoute {
  schema = {
    tags: ["Question"],
    summary: "Fetch Question by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Question",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              question: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Question not found",
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
      const question = await db.select().from(questionsTable).where(eq(questionsTable.id, params.id));
      if (!question.length) {
        return c.json({ success: false, message: 'Question not found' }, 404);
      }
      return c.json({ success: true, question: question[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch question', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
