import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class RelationshipUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Update Relationship",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              status: z.string(),
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
        description: "Returns the updated Relationship",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              relationship: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Relationship not found",
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
      const updated = await db.update(relationshipsTable).set(body).where(and(eq(relationshipsTable.id, params.id), eq(relationshipsTable.deleted, false))).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }
      return c.json({ success: true, relationship: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
