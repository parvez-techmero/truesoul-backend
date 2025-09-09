
  import { Bool, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';

  export class UserList extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "List Users",
      responses: {
        "200": {
          description: "Returns a list of Users",
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
        console.log(db,"Asd");
        
        const users = await db.select().from(usersTable);
        console.log(users,"Ad");
        
        return c.json({ success: true, data: users });
      } catch (err) {
        return c.json({ error: 'Failed to fetch users', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }
