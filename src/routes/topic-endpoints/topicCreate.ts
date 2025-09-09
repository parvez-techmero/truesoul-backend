import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { topicsTable } from '../../db/schema';

export class TopicCreate extends OpenAPIRoute {
  schema = {
    tags: ["Topic"],
    summary: "Create Topic",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string(),
              description: z.string().optional(),
              categoryId: z.number(),
              icon: z.string().optional(),
              color: z.string().optional(),
              sortOrder: z.number().optional(),
              isActive: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Topic",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              topic: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const topic = await db.insert(topicsTable).values(body).returning();
      return c.json({ success: true, topic: topic[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
