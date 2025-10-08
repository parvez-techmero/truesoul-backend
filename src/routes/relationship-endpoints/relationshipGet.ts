import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable, usersTable } from '../../db/schema';
import { eq, and, or } from 'drizzle-orm';

export class RelationshipGet extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Fetch Relationship by ID or User ID with User Details",
    request: {
      query: z.object({
        relationshipId: Num().optional(),
        userId: Num().optional(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the Relationship with user details",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              data: z.any(),
            }),
          },
        },
      },
      "400": {
        description: "Bad request - missing or invalid parameters",
        content: {
          "application/json": {
            schema: z.object({
              success: z.literal(false),
              message: z.string(),
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
    const { query } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      // Validate that at least one parameter is provided
      if (!query.relationshipId && !query.userId) {
        return c.json({ 
          success: false, 
          message: 'Either relationshipId or userId must be provided' 
        }, 400);
      }

      let relationship;

      // Get relationship by relationshipId or userId
      if (query.relationshipId) {
        [relationship] = await db.select().from(relationshipsTable).where(
          eq(relationshipsTable.id, query.relationshipId)
        );
      } else if (query.userId) {
        [relationship] = await db.select().from(relationshipsTable).where(
          or(
            eq(relationshipsTable.user1Id, query.userId),
            eq(relationshipsTable.user2Id, query.userId)
          )
        );
      }
      
      if (!relationship) {
        return c.json({ success: false, message: 'Relationship not found' }, 404);
      }

      // Get user1 details
      const [user1] = await db.select().from(usersTable).where(eq(usersTable.id, relationship.user1Id));
      
      // Get user2 details only if relationship is not deleted/disconnected
      let user2 = null;
      if (!relationship.deleted) {
        [user2] = await db.select().from(usersTable).where(eq(usersTable.id, relationship.user2Id));
      }

      // Prepare response with isDisconnect flag
      const responseData = {
        ...relationship,
        user1: user1 || null,
        user2: user2,
        isDisconnect: relationship.deleted, // true if relationship is deleted/disconnected
      };

      return c.json({ success: true, data: responseData });
    } catch (err) {
      return c.json({ error: 'Failed to fetch relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
