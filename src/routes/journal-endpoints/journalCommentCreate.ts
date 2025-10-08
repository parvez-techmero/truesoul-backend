import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { journalCommentsTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class JournalCommentCreate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Add Comment to Journal (max 2 users)",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              journalId: z.number(),
              userId: z.number(),
              comment: z.string(),
            })
          }
        }
      },
    },
    responses: {
      "200": {
        description: "Comment added",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              comment: z.any(),
            }),
          },
        },
      },
      "400": {
        description: "Comment not allowed",
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
    const body = await c.req.json();
    const { journalId, userId, comment } = body;

    // Get unique userIds who have commented on this journal
    const existingComments = await db.select({ userId: journalCommentsTable.userId })
      .from(journalCommentsTable)
      .where(eq(journalCommentsTable.journalId, journalId));
    const uniqueUserIds = Array.from(new Set(existingComments.map(c => c.userId)));

    // If two users have already commented and this user is not one of them, block
    if (uniqueUserIds.length >= 2 && !uniqueUserIds.includes(userId)) {
      return c.json({ success: false, message: 'Only two users can comment on this journal.' }, 400);
    }

    // Add comment
    const newComment = await db.insert(journalCommentsTable).values({ journalId, userId, comment }).returning();
    return c.json({ success: true, comment: newComment[0] });
  }
}
