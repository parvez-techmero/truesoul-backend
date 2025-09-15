
import { OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class JournalUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Update Journal Entry",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              id: Num(),
              title: Str().optional(),
              colorCode: Str().optional(),
              dateTime: Str().optional(),
              lat: Str().optional(),
              long: Str().optional(),
              images: Str().optional(),
              description: Str().optional(),
              type: z.enum(["memory", "special_day"]).optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the updated journal entry",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              journal: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    const { id, ...updateFields } = body;
    try {
      const journal = await db.update(journalTable).set(updateFields).where(eq(journalTable.id, id)).returning();
      return c.json({ success: true, journal: journal[0] });
    } catch (err) {
      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
