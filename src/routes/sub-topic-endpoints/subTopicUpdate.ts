import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { subTopicsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class SubTopicUpdate extends OpenAPIRoute {
  schema = {
    tags: ["SubTopic"],
    summary: "Update SubTopic",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              description: z.string().optional(),
              topicId: z.number().optional(),
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
        description: "Returns the updated SubTopic",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              subTopic: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "SubTopic not found",
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
      const updated = await db.update(subTopicsTable).set(body).where(eq(subTopicsTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'SubTopic not found' }, 404);
      }
      return c.json({ success: true, subTopic: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update sub-topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
