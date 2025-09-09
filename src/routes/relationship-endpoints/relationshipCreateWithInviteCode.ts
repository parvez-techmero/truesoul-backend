import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable, usersTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export class RelationshipCreateWithInviteCode extends OpenAPIRoute {
	schema = {
		tags: ["Relationship"],
		summary: "Create Relationship with Invite Code",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							user1Id: Num(),
							inviteCode: z.string(),
							// status: z.string().default('accepted'),
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
			"404": {
				description: "User with invite code not found",
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
		const { body } = await this.getValidatedData<typeof this.schema>();
		const db = c.get('db');
		try {
			// Find user2 by inviteCode
			const [user2] = await db.select().from(usersTable).where(eq(usersTable.inviteCode, body.inviteCode));
            
			if (!user2) {
                return c.json({ success: false, message: 'User with invite code not found' }, 404);
			}
			const relationshipData = {
                user1Id: body.user1Id,
				user2Id: user2.id,
				// status: body.status,
			};
            console.log(relationshipData,"aasd");
			const relationship = await db.insert(relationshipsTable).values(relationshipData).returning();
			return c.json({ success: true, relationship: relationship[0] });
		} catch (err) {
			return c.json({ error: 'Failed to create relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}
