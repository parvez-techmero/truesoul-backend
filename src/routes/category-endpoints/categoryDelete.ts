import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { categoriesTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class CategoryDelete extends OpenAPIRoute {
  schema = {
    tags: ["Category"],
    summary: "Delete Category by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Successfully deleted",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
      "404": {
        description: "Category not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
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
      const deleted = await db.delete(categoriesTable).where(eq(categoriesTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'Category not found' }, 404);
      }
      return c.json({ success: true, message: 'Category deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete category', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
