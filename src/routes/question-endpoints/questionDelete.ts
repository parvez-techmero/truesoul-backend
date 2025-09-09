import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { questionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class QuestionDelete extends OpenAPIRoute {
  schema = {
    tags: ["Question"],
    summary: "Delete Question by ID",
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
        description: "Question not found",
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
      const deleted = await db.delete(questionsTable).where(eq(questionsTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'Question not found' }, 404);
      }
      return c.json({ success: true, message: 'Question deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete question', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
