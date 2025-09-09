import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { topicsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class TopicGet extends OpenAPIRoute {
  schema = {
    tags: ["Topic"],
    summary: "Fetch Topic by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Topic",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              topic: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Topic not found",
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
      const topic = await db.select().from(topicsTable).where(eq(topicsTable.id, params.id));
      if (!topic.length) {
        return c.json({ success: false, message: 'Topic not found' }, 404);
      }
      return c.json({ success: true, topic: topic[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
