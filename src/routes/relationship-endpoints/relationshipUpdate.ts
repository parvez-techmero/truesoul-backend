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
              status: z.string().optional(),
              deleted: z.boolean().optional(),
              reason: z.string().optional(),
              startedAt: z.string().optional(),
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
      // Check if relationship exists (allow updating even deleted ones)
      const existing = await db.select().from(relationshipsTable).where(eq(relationshipsTable.id, params.id));
      if (!existing.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }

      // Prepare update data
      const updateData: any = {
        ...body,
        updatedAt: new Date().toISOString()
      };

      // If reconnecting (setting deleted to false), reset startedAt
      if (body.deleted === false && existing[0].deleted === true) {
        updateData.startedAt = new Date().toISOString();
      }

      const updated = await db.update(relationshipsTable)
        .set(updateData)
        .where(eq(relationshipsTable.id, params.id))
        .returning();
      
      return c.json({ 
        success: true, 
        relationship: updated[0],
        message: body.deleted === false && existing[0].deleted === true 
          ? 'Relationship reconnected successfully' 
          : 'Relationship updated successfully'
      });
    } catch (err) {
      return c.json({ error: 'Failed to update relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
