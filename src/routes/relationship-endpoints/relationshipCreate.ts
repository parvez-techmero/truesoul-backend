import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable } from '../../db/schema';

export class RelationshipCreate extends OpenAPIRoute {
  schema = {
    tags: ["Relationship"],
    summary: "Create Relationship",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              user1Id: Num(),
              user2Id: Num()
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Relationship",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              relationship: z.any(),
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
      const relationship = await db.insert(relationshipsTable).values(body).returning();
      return c.json({ success: true, relationship: relationship[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
