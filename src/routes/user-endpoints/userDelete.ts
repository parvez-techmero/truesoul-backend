
  import { Num, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq } from 'drizzle-orm';

  export class UserDelete extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "Delete User by ID",
      request: {
        params: z.object({
          id: Num(),
        }),
      },
      responses: {
        "200": {
          description: "Successfully deleted",
          content: {
            "application/json": {
              schema: z.object({
                success: z.boolean(),
                message: z.string(),
              }),
            },
          },
        },
        "404": {
          description: "User not found",
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
      const { params } = await this.getValidatedData<typeof this.schema>();
      const db = c.get('db');
      try {
        const deleted = await db.delete(usersTable).where(eq(usersTable.id, params.id)).returning();
        if (!deleted.length) {
          return c.json({ success: false, message: 'User not found' }, 404);
        }
        return c.json({ success: true, message: 'User deleted successfully' });
      } catch (err) {
        return c.json({ error: 'Failed to delete user', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }
