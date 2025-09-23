
import { Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { updateUserSchema, userSchema } from "../../types";

export class UserUpdate extends OpenAPIRoute {
  schema = {
    tags: ["User"],
    summary: "Update User",
    request: {
      body: {
        content: {
          "application/json": {
            schema: updateUserSchema
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
              data: userSchema
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
      // Generate unique invite code
      // let inviteCode: string;
      // let isUnique = false;
      // let attempts = 0;
      // const maxAttempts = 10;

      // do {
      //   inviteCode = generateInviteCode(8);
      //   const [existingCode] = await db.select().from(usersTable).where(eq(usersTable.inviteCode, inviteCode));
      //   isUnique = !existingCode;
      //   attempts++;
      // } while (!isUnique && attempts < maxAttempts);

      // if (!isUnique) {
      //   return c.json({ success: false, error: "Unable to generate unique invite code" }, 500);
      // }

      // let userData = {
      //   ...body,
      //   inviteCode: inviteCode,
      // }
      
      // First check if user exists and is not deleted
      const existingUser = await db.select().from(usersTable).where(
        and(
          eq(usersTable.id, params.id),
          eq(usersTable.deleted, false)
        )
      );
      
      if (!existingUser.length) {
        return c.json({ success: false, message: 'User not found' }, 404);
      }
      
      const updated = await db.update(usersTable).set({
        ...body,
        updatedAt: new Date()
      }).where(
        and(
          eq(usersTable.id, params.id),
          eq(usersTable.deleted, false)
        )
      ).returning();
      
      if (!updated.length) {
        return c.json({ success: false, message: 'User not found' }, 404);
      }
      return c.json({ success: true, data: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update user', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}

