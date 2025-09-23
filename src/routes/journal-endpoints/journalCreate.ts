
import { OpenAPIRoute, Str, Num } from "chanfana";
import { z } from "zod";
import { journalTable, relationshipsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class JournalCreate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Create Journal Entry",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              relationshipId: Num(),
              type: z.enum(["memory", "special_day"]),
              title: Str(),
              colorCode: Str().optional(),
              dateTime: Str().optional(),
              lat: Str().optional(),
              long: Str().optional(),
              images: Str().optional(),
              description: Str().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created journal entry",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              journal: z.any(),
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
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      // Validate relationship exists and is not deleted
      const relationship = await db.select().from(relationshipsTable).where(and(eq(relationshipsTable.id, body.relationshipId), eq(relationshipsTable.deleted, false)));
      if (!relationship.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }

      const journal = await db.insert(journalTable).values(body).returning();
      return c.json({ success: true, journal: journal[0] });
    } catch (err) {
      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
