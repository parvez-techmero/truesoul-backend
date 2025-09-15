import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';
import { desc } from 'drizzle-orm';

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
    },
  };

  async handle(c) {
    const { query } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    const { eq } = await import('drizzle-orm');
    const journals = await db.select().from(journalTable)
      .where(eq(journalTable.relationshipId, query.relationshipId))
      .orderBy(desc(journalTable.dateTime));
    return c.json({ success: true, data: journals });
  }
}
