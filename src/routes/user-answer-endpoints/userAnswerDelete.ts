import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class UserAnswerDelete extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Delete User Answer by ID",
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
        description: "User Answer not found",
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
      const deleted = await db.delete(userAnswersTable).where(eq(userAnswersTable.id, params.id)).returning();
      if (!deleted.length) {
        return c.json({ success: false, message: 'User Answer not found' }, 404);
      }
      return c.json({ success: true, message: 'User Answer deleted successfully' });
    } catch (err) {
      return c.json({ error: 'Failed to delete user answer', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
