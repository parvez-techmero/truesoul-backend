import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { subTopicsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class SubTopicDelete extends OpenAPIRoute {
  schema = {
    tags: ["SubTopic"],
    summary: "Delete SubTopic by ID",
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
        description: "SubTopic not found",
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
      const deleted = await db.delete(subTopicsTable).where(eq(subTopicsTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'SubTopic not found' }, 404);
      }
      return c.json({ success: true, message: 'SubTopic deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete sub-topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
