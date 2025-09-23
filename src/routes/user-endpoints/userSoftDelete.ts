  import { Num, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq, and } from 'drizzle-orm';

  export class UserSoftDelete extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "Soft Delete User by ID (Recoverable)",
      request: {
        params: z.object({
          id: Num(),
        }),
      },
      responses: {
        "200": {
          description: "Successfully soft deleted",
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
          description: "User not found or already deleted",
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
        const updated = await db
          .update(usersTable)
          .set({ 
            deleted: true,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(usersTable.id, params.id),
              eq(usersTable.deleted, false)
            )
          )
          .returning();
        
        if (!updated.length) {
          return c.json({ success: false, message: 'User not found or already deleted' }, 404);
        }
        return c.json({ success: true, message: 'User soft deleted successfully' });
      } catch (err) {
        return c.json({ error: 'Failed to soft delete user', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }
