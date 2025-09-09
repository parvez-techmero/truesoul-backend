import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { categoriesTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class CategoryUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Category"],
    summary: "Update Category",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              name: z.string().optional(),
              description: z.string().optional(),
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
        description: "Returns the updated Category",
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
    const { body, params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const updated = await db.update(categoriesTable).set(body).where(eq(categoriesTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Category not found' }, 404);
      }
      return c.json({ success: true, category: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update category', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
