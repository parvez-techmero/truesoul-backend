import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { journalCommentsTable, usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class JournalCommentList extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Get Comments for a Journal",
    request: {
      params: z.object({
        id: z.string(), // journalId
      })
    },
    responses: {
      "200": {
        description: "Returns comments for the journal",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
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
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const db = c.get('db');
    const params = c.req.param();
    const journalId = Number(params.id);
    if (!journalId) {
      return c.json({ success: false, message: 'Invalid journal id' }, 404);
    }
    // Get comments for the journal, optionally join with user info
    const comments = await db.select()
      .from(journalCommentsTable)
      .where(eq(journalCommentsTable.journalId, journalId));
    return c.json({ success: true, comments });
  }
}
