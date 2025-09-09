import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { subTopicsTable } from '../../db/schema';

export class SubTopicCreate extends OpenAPIRoute {
  schema = {
    tags: ["SubTopic"],
    summary: "Create SubTopic",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string(),
              description: z.string().optional(),
              topicId: z.number(),
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
        description: "Returns the created SubTopic",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              subTopic: z.any(),
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
      const subTopic = await db.insert(subTopicsTable).values(body).returning();
      return c.json({ success: true, subTopic: subTopic[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create sub-topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
