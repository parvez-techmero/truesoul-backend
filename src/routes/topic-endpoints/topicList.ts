import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { topicsTable } from '../../db/schema';

export class TopicList extends OpenAPIRoute {
  schema = {
    tags: ["Topic"],
    summary: "List Topics",
    responses: {
      "200": {
        description: "Returns a list of Topics",
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
      const topics = await db.select().from(topicsTable);
      return c.json({ success: true, data: topics });
    } catch (err) {
      return c.json({ error: 'Failed to fetch topics', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
