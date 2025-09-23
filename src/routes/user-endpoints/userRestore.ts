  import { Num, OpenAPIRoute } from "chanfana";
  import { z } from "zod";
  import { usersTable } from '../../db/schema';
  import { eq, and } from 'drizzle-orm';

  export class UserRestore extends OpenAPIRoute {
    schema = {
      tags: ["User"],
      summary: "Restore Soft Deleted User by ID",
      request: {
        params: z.object({
          id: Num(),
        }),
      },
      responses: {
        "200": {
          description: "Successfully restored",
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
          description: "User not found or not deleted",
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
            deleted: false,
            updatedAt: new Date()
          })
          .where(
            and(
              eq(usersTable.id, params.id),
              eq(usersTable.deleted, true)
            )
          )
          .returning();
        
        if (!updated.length) {
          return c.json({ success: false, message: 'User not found or not deleted' }, 404);
        }
        return c.json({ success: true, message: 'User restored successfully' });
      } catch (err) {
        return c.json({ error: 'Failed to restore user', detail: err instanceof Error ? err.message : String(err) }, 500);
      }
    }
  }