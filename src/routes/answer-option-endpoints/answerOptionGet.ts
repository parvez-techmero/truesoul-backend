import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { answerOptionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class AnswerOptionGet extends OpenAPIRoute {
  schema = {
    tags: ["AnswerOption"],
    summary: "Fetch Answer Option by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Answer Option",
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
    const { params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const answerOption = await db.select().from(answerOptionsTable).where(eq(answerOptionsTable.id, params.id));
      if (!answerOption.length) {
        return c.json({ success: false, message: 'Answer Option not found' }, 404);
      }
      return c.json({ success: true, answerOption: answerOption[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch answer option', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
