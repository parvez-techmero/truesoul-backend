import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { categoriesTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class CategoryGet extends OpenAPIRoute {
  schema = {
    tags: ["Category"],
    summary: "Fetch Category by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Category",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              category: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Category not found",
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
      const category = await db.select().from(categoriesTable).where(eq(categoriesTable.id, params.id));
      if (!category.length) {
        return c.json({ success: false, message: 'Category not found' }, 404);
      }
      return c.json({ success: true, category: category[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch category', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
