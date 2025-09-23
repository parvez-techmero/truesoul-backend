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
      
      const relationship = await db.insert(relationshipsTable).values(body).returning();
      return c.json({ success: true, relationship: relationship[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
