
  import { Num, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq } from 'drizzle-orm';

  export class UserUpdate extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "Update User",
      request: {
        body: {
          content: {
            "application/json": {
              schema: z.object({}), // Replace with updateUserSchema if available
            },
          },
        },
        params: z.object({
          id: Num(),
        }),
      },
      responses: {
        "200": {
          description: "Returns the updated User",
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
      const { body, params } = await this.getValidatedData<typeof this.schema>();
      const db = c.get('db');
      try {
        const updated = await db.update(usersTable).set(body).where(eq(usersTable.id, params.id)).returning();
        if (!updated.length) {
          return c.json({ success: false, message: 'User not found' }, 404);
        }
        return c.json({ success: true, user: updated[0] });
      } catch (err) {
        return c.json({ error: 'Failed to update user', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }
