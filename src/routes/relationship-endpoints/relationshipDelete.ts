import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class RelationshipDelete extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Delete Relationship by ID",
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
        description: "Relationship not found",
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
      const deleted = await db.delete(relationshipsTable).where(eq(relationshipsTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }
      return c.json({ success: true, message: 'Relationship deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
