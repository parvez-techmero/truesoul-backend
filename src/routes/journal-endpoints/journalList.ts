
import { OpenAPIRoute, Num, Str, Bool } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class JournalList extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "List Journal Entries",
    request: {
      query: z.object({
        relationshipId: Num(),
        type: z.enum(["memory", "special_day"]).optional(),
      }),
    },
    responses: {
      "200": {
        description: "Returns a list of journal entries",
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
    let whereClause = eq(journalTable.relationshipId, query.relationshipId);
    if (query.type) {
      whereClause = and(whereClause, eq(journalTable.type, query.type));
    }
    const journals = await db.select().from(journalTable).where(whereClause);
    return c.json({ success: true, data: journals });
  }
}
