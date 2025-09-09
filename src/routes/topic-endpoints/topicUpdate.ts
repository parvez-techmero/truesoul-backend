import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { topicsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class TopicUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Topic"],
    summary: "Update Topic",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              description: z.string().optional(),
              categoryId: z.number().optional(),
              icon: z.string().optional(),
              color: z.string().optional(),
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
        description: "Returns the updated Topic",
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
    const { body, params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const updated = await db.update(topicsTable).set(body).where(eq(topicsTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Topic not found' }, 404);
      }
      return c.json({ success: true, topic: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
