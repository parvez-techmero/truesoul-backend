import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { categoriesTable } from '../../db/schema';
import { createCategorySchema } from "../../types";

export class CategoryCreate extends OpenAPIRoute {
  schema = {
    tags: ["Category"],
    summary: "Create Category",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createCategorySchema
            // z.object({
            //   name: z.string(),
            //   description: z.string().optional(),
            //   icon: z.string().optional(),
            //   color: z.string().optional(),
            //   sortOrder: z.number().optional(),
            //   isActive: z.boolean().optional(),
            // }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Category",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              category: z.any(),
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
      const category = await db.insert(categoriesTable).values(body).returning();
      return c.json({ success: true, category: category[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create category', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
