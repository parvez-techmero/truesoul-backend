import { OpenAPIRoute, Bool, Num } from "chanfana";
import { z } from "zod";
import { journalTable, relationshipsTable, usersTable } from '../../db/schema';
import { desc, eq, and } from 'drizzle-orm';

export class JournalAll extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "List All Journals for Relationship Datewise",
    request: {
      query: z.object({
        relationshipId: Num().optional(),
        userId: Num().optional(),
        type: z.union([
          z.enum(["memory", "special_day"]),
          z.array(z.enum(["memory", "special_day"]))
        ]).optional(),
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
    const { relationshipId, userId, type: typeFilter } = query;

    // Validate that either relationshipId or userId is provided
    if (!relationshipId && !userId) {
      return c.json({ success: false, message: 'Either relationshipId or userId must be provided' }, 400);
    }

    let whereClause;
    
    // Priority to relationshipId
    if (relationshipId) {
      // Validate relationship exists (include deleted to check connection status)
      const relationship = await db.select().from(relationshipsTable).where(eq(relationshipsTable.id, relationshipId));
      
      if (!relationship.length) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }

      // Check if relationship is disconnected
      const isDisconnected = relationship[0].deleted;

      if (isDisconnected) {
        // For disconnected relationship, fetch journals for user1 only
        whereClause = eq(journalTable.createdByUserId, relationship[0].user1Id);
      } else {
        // For connected relationship, fetch journals for the relationship
        whereClause = eq(journalTable.relationshipId, relationshipId);
      }
    } else if (userId) {
      // Single user mode
      whereClause = eq(journalTable.createdByUserId, userId);
    }

    // Add type filter if provided
    if (typeFilter !== undefined) {
      const { inArray } = await import('drizzle-orm');
      if (Array.isArray(typeFilter)) {
        whereClause = and(whereClause, inArray(journalTable.type, typeFilter));
      } else {
        whereClause = and(whereClause, eq(journalTable.type, typeFilter));
      }
    }

    // Join with usersTable to get user details
    const journals = await db
      .select({
        journal: journalTable,
        user: usersTable
      })
      .from(journalTable)
      .leftJoin(usersTable, eq(journalTable.createdByUserId, usersTable.id))
      .where(whereClause)
      .orderBy(desc(journalTable.dateTime));

    // Map journals: if images is [], set images to "" and include user details
    const mappedJournals = journals.map(row => {
      const journal = row.journal;
      const user = row.user;
      return {
        ...journal,
        images: journal.images == "[]" ? "" : journal.images,
        user: user ? {
          id: user.id,
          name: user.name,
          profileImg: user.profileImg,
          gender: user.gender,
        } : null
      };
    });
    
    return c.json({ success: true, data: mappedJournals });
  }
}
