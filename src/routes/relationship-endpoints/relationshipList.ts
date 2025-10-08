import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { relationshipsTable, usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class RelationshipList extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "List Relationships",
    responses: {
      "200": {
        description: "Returns a list of Relationships with user details",
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
    const db = c.get('db');
    try {
      const relationships = await db.select().from(relationshipsTable).where(eq(relationshipsTable.deleted, false));
      
      // Get user details for each relationship
      const relationshipsWithUsers = await Promise.all(
        relationships.map(async (rel) => {
          const [user1] = await db.select().from(usersTable).where(eq(usersTable.id, rel.user1Id));
          const [user2] = await db.select().from(usersTable).where(eq(usersTable.id, rel.user2Id));
          
          return {
            ...rel,
            user1: user1 || null,
            user2: user2 || null,
            isDisconnect: rel.deleted,
          };
        })
      );
      
      return c.json({ success: true, data: relationshipsWithUsers });
    } catch (err) {
      return c.json({ error: 'Failed to fetch relationships', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
