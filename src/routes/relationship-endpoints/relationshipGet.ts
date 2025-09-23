import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class RelationshipGet extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Fetch Relationship by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Relationship",
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
    const { params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const relationship = await db.select().from(relationshipsTable).where(and(eq(relationshipsTable.id, params.id), eq(relationshipsTable.deleted, false)));
      if (!relationship.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }
      return c.json({ success: true, relationship: relationship[0] });
    } catch (err) {
      return c.json({ error: 'Failed to fetch relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
