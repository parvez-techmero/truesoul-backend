import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { categoriesTable } from '../../db/schema';

export class CategoryList extends OpenAPIRoute {
  schema = {
    tags: ["Category"],
    summary: "List Categories",
    responses: {
      "200": {
        description: "Returns a list of Categories",
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
      const categories = await db.select().from(categoriesTable);
      return c.json({ success: true, data: categories });
    } catch (err) {
      return c.json({ error: 'Failed to fetch categories', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
