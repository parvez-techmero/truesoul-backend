import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { answerOptionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class AnswerOptionDelete extends OpenAPIRoute {
  schema = {
    tags: ["AnswerOption"],
    summary: "Delete Answer Option by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Successfully deleted",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
      "404": {
        description: "Answer Option not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
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
      const deleted = await db.delete(answerOptionsTable).where(eq(answerOptionsTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'Answer Option not found' }, 404);
      }
      return c.json({ success: true, message: 'Answer Option deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete answer option', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
