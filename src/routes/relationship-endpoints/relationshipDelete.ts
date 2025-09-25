import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class RelationshipDelete extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Delete Relationship by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
      body: {
        content: {
          "application/json": {
            schema: z.object({
              reason: z.string().nullable().optional(),
            }),
          },
        },
      },
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
    const data = await this.getValidatedData<typeof this.schema>();
    const params = data?.params;
  // body will be under data.body?.reason
  const body = data?.body;
    const db = c.get('db');
    try {
      if (!params || !body) {
        return c.json({ success: false, message: 'Invalid request' }, 400);
      }
      // Soft delete: update the relationship with the reason and set deleted=true
      const updated = await db.update(relationshipsTable)
        .set({ reason: body.reason, deleted: true })
        .where(and(eq(relationshipsTable.id, params.id), eq(relationshipsTable.deleted, false)))
        .returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }
      return c.json({ success: true, message: 'Relationship deleted (soft) successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
