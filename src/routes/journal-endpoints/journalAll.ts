import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { journalTable, relationshipsTable } from '../../db/schema';
import { desc, eq, and } from 'drizzle-orm';

export class JournalAll extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "List All Journals for Relationship Datewise",
    request: {
      query: z.object({
        relationshipId: z.number(),
      }),
    },
    responses: {
      "200": {
        description: "Returns all journal entries for a relationship sorted by date",
        content: {
          "application/json": {
            schema: z.object({
              success: Bool(),
              data: z.array(z.any()),
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
    const { query } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    
    // Validate relationship exists and is not deleted
    const relationship = await db.select().from(relationshipsTable).where(and(eq(relationshipsTable.id, query.relationshipId), eq(relationshipsTable.deleted, false)));
    if (!relationship.length) {
      return c.json({ success: false, message: 'Relationship not found' }, 404);
    }

    const journals = await db.select().from(journalTable)
      .where(eq(journalTable.relationshipId, query.relationshipId))
      .orderBy(desc(journalTable.dateTime));
    return c.json({ success: true, data: journals });
  }
}
