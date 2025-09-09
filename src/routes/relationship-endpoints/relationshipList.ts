import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';

export class RelationshipList extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "List Relationships",
    responses: {
      "200": {
        description: "Returns a list of Relationships",
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
      const relationships = await db.select().from(relationshipsTable);
      return c.json({ success: true, data: relationships });
    } catch (err) {
      return c.json({ error: 'Failed to fetch relationships', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
