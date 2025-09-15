
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class JournalDelete extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Delete Journal Entry",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: Num(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns success/failure",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
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
      await db.delete(journalTable).where(eq(journalTable.id, body.id));
      return c.json({ success: true });
    } catch (err) {
      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
