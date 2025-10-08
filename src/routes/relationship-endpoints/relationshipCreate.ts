import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable, usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';

export class RelationshipCreate extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Create Relationship",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              user1Id: Num(),
              user2Id: Num()
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Relationship",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              relationship: z.any(),
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
      // Check if both users exist and are not deleted
      const user1 = await db.select().from(usersTable).where(
        and(
          eq(usersTable.id, body.user1Id),
          eq(usersTable.deleted, false)
        )
      );
      
      const user2 = await db.select().from(usersTable).where(
        and(
          eq(usersTable.id, body.user2Id),
          eq(usersTable.deleted, false)
        )
      );
      
      if (!user1.length || !user2.length) {
        return c.json({ 
          success: false, 
          error: 'One or both users not found' 
        }, 404);
      }

      // Prevent self-relationship
      if (body.user1Id === body.user2Id) {
        return c.json({ 
          success: false, 
          error: 'Cannot create relationship with yourself' 
        }, 400);
      }

      // Check if relationship already exists (in any order, including deleted ones)
      const existingRelationship = await db.select().from(relationshipsTable).where(
        and(
          eq(relationshipsTable.user1Id, body.user1Id),
          eq(relationshipsTable.user2Id, body.user2Id)
        )
      );

      const existingRelationshipReverse = await db.select().from(relationshipsTable).where(
        and(
          eq(relationshipsTable.user1Id, body.user2Id),
          eq(relationshipsTable.user2Id, body.user1Id)
        )
      );

      // If relationship exists
      if (existingRelationship.length > 0) {
        const existing = existingRelationship[0];
        if (existing.deleted) {
          // Reconnect - update deleted to false and reset startedAt
          const now = new Date().toISOString();
          const reconnected = await db.update(relationshipsTable)
            .set({ 
              deleted: false, 
              startedAt: now,
              updatedAt: now
            })
            .where(eq(relationshipsTable.id, existing.id))
            .returning();
          return c.json({ 
            success: true, 
            relationship: reconnected[0],
            message: 'Relationship reconnected successfully'
          });
        } else {
          // Already connected
          return c.json({ 
            success: false, 
            error: 'Relationship already exists',
            relationship: existing
          }, 409);
        }
      }

      if (existingRelationshipReverse.length > 0) {
        const existing = existingRelationshipReverse[0];
        if (existing.deleted) {
          // Reconnect - update deleted to false and reset startedAt
          const now = new Date().toISOString();
          const reconnected = await db.update(relationshipsTable)
            .set({ 
              deleted: false, 
              startedAt: now,
              updatedAt: now
            })
            .where(eq(relationshipsTable.id, existing.id))
            .returning();
          return c.json({ 
            success: true, 
            relationship: reconnected[0],
            message: 'Relationship reconnected successfully'
          });
        } else {
          // Already connected
          return c.json({ 
            success: false, 
            error: 'Relationship already exists',
            relationship: existing
          }, 409);
        }
      }
      
      // Create new relationship if none exists
      const now = new Date().toISOString();
      const relationship = await db.insert(relationshipsTable).values({
        user1Id: body.user1Id,
        user2Id: body.user2Id,
        startedAt: now
      }).returning();
      return c.json({ 
        success: true, 
        relationship: relationship[0],
        message: 'Relationship created successfully'
      });
    } catch (err) {
      return c.json({ error: 'Failed to create relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
