import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { answerOptionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class AnswerOptionUpdate extends OpenAPIRoute {
  schema = {
    tags: ["AnswerOption"],
    summary: "Update Answer Option",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              questionId: z.number().optional(),
              text: z.string().optional(),
              isCorrect: z.boolean().optional(),
              sortOrder: z.number().optional(),
              isActive: z.boolean().optional(),
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
        description: "Returns the updated Answer Option",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              answerOption: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Answer Option not found",
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
      const updated = await db.update(answerOptionsTable).set(body).where(eq(answerOptionsTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Answer Option not found' }, 404);
      }
      return c.json({ success: true, answerOption: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update answer option', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
