import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { topicsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class TopicDelete extends OpenAPIRoute {
  schema = {
    tags: ["Topic"],
    summary: "Delete Topic by ID",
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
        description: "Topic not found",
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
      const deleted = await db.delete(topicsTable).where(eq(topicsTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'Topic not found' }, 404);
      }
      return c.json({ success: true, message: 'Topic deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
