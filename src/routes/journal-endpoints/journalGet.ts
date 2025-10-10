
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { journalTable, journalCommentsTable, usersTable } from '../../db/schema';
import { eq, inArray } from 'drizzle-orm';

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
    // Fetch user who created the journal
    const user = journal[0].createdByUserId
      ? (await db.select({
        profileImg: usersTable.profileImg,
        id: usersTable.id,
        gender: usersTable.gender,
        name: usersTable.name,
      }).from(usersTable).where(eq(usersTable.id, journal[0].createdByUserId)))[0]
      : null;
    // Fetch comments and their users
    const commentsRaw = await db.select().from(journalCommentsTable).where(eq(journalCommentsTable.journalId, params.id));
    const commentUserIds = commentsRaw.map(c => c.userId);
    let commentUsers = [];
    if (commentUserIds.length) {
      commentUsers = await db.select().from(usersTable).where(inArray(usersTable.id, commentUserIds));
    }
    // Attach user info to each comment
    const comments = commentsRaw.map(comment => ({
      ...comment,
      user: commentUsers.find(u => u.id === comment.userId) || null
    }));
    journal[0].images = journal[0].images == "[]" ? "" : journal[0].images;
    return c.json({ success: true, data: { ...journal[0], user, comments } });
  }
}
