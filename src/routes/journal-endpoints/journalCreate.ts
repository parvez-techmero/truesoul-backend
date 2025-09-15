
import { OpenAPIRoute, Str, Num } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';

export class JournalCreate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Create Journal Entry",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              relationshipId: Num(),
              type: z.enum(["memory", "special_day"]),
              title: Str(),
              colorCode: Str().optional(),
              dateTime: Str().optional(),
              lat: Str().optional(),
              long: Str().optional(),
              images: Str().optional(),
              description: Str().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created journal entry",
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
    try {
      const journal = await db.insert(journalTable).values(body).returning();
      return c.json({ success: true, journal: journal[0] });
    } catch (err) {
      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
