  import { Bool, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq } from 'drizzle-orm';

  export class UserListDeleted extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "List Deleted Users (Admin)",
      responses: {
        "200": {
          description: "Returns a list of deleted Users",
          content: {
            "application/json": {
              schema: z.object({
                success: Bool(),
                data: z.array(z.any()), // Replace z.any() with userSchema if available
              }),
            },
          },
        },
      },
    };

    async handle(c) {
      const db = c.get('db');
      try {
        const deletedUsers = await db.select().from(usersTable).where(eq(usersTable.deleted, true));
        
        return c.json({ success: true, data: deletedUsers });
      } catch (err) {
        return c.json({ error: 'Failed to fetch deleted users', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }