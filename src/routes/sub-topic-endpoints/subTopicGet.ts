import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { subTopicsTable, questionsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class SubTopicGet extends OpenAPIRoute {
  schema = {
    tags: ["SubTopic"],
    summary: "Fetch SubTopic by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the SubTopic",
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
    const { params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const subTopic = await db.select().from(subTopicsTable).where(eq(subTopicsTable.id, params.id));
      if (!subTopic.length) {
        return c.json({ success: false, message: 'SubTopic not found' }, 404);
      }
  // Fetch questions for this subtopic
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.subTopicId, params.id));
  return c.json({ success: true, data: {...subTopic[0],questions} });
    } catch (err) {
      return c.json({ error: 'Failed to fetch sub-topic', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
