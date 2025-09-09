import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { subTopicsTable } from '../../db/schema';

export class SubTopicList extends OpenAPIRoute {
  schema = {
    tags: ["SubTopic"],
    summary: "List SubTopics",
    responses: {
      "200": {
        description: "Returns a list of SubTopics",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.array(z.any()),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const db = c.get('db');
    try {
      const subTopics = await db.select().from(subTopicsTable);
      return c.json({ success: true, data: subTopics });
    } catch (err) {
      return c.json({ error: 'Failed to fetch sub-topics', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
