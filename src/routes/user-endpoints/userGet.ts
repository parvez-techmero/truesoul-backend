
  import { Num, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq } from 'drizzle-orm';

  export class UserGet extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "Fetch User by ID",
      request: {
        params: z.object({
          id: Num(),
        }),
      },
      responses: {
        "200": {
          description: "Returns the User",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                user: z.any(), // Replace with userSchema if available
              }),
            },
          },
        },
        "404": {
          description: "User not found",
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
      try {
        const user = await db.select().from(usersTable).where(eq(usersTable.id, params.id));
        if (!user.length) {
          return c.json({ success: false, message: 'User not found' }, 404);
        }
        return c.json({ success: true, user: user[0] });
      } catch (err) {
        return c.json({ error: 'Internal server error', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }
