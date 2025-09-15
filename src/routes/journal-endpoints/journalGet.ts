
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { journalTable, journalCommentsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class JournalGet extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Get Journal Entry by ID",
    request: {
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the journal entry with comments",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              journal: z.any(),
              comments: z.array(z.any()),
            }),
          },
        },
      },
      "404": {
        description: "Journal not found",
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
    const journal = await db.select().from(journalTable).where(eq(journalTable.id, params.id));
    if (!journal.length) {
      return c.json({ success: false, message: "Journal not found" }, 404);
    }
    const comments = await db.select().from(journalCommentsTable).where(eq(journalCommentsTable.journalId, params.id));
    return c.json({ success: true, journal: journal[0], comments });
  }
}
