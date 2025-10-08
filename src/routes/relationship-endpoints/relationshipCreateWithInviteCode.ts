import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { relationshipsTable, usersTable } from '../../db/schema';
import { eq, and, sql } from 'drizzle-orm';

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
							data: z.any(),
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
			// Find user2 by inviteCode (case-insensitive)
			const [user2] = await db.select().from(usersTable).where(sql`UPPER(${usersTable.inviteCode}) = UPPER(${body.inviteCode})`);
			const [user1] = await db.select().from(usersTable).where(eq(usersTable.id, body.user1Id));
            
			if (!user2) {
                return c.json({ success: false, message: 'User with invite code not found' }, 404);
			}

			if (!user1) {
                return c.json({ success: false, message: 'User not found' }, 404);
			}

			// Prevent self-relationship
			if (body.user1Id === user2.id) {
				return c.json({ 
					success: false, 
					message: 'Cannot create relationship with yourself' 
				}, 400);
			}

			// Check if relationship already exists (in any order, including deleted ones)
			const existingRelationship = await db.select().from(relationshipsTable).where(
				and(
					eq(relationshipsTable.user1Id, body.user1Id),
					eq(relationshipsTable.user2Id, user2.id)
				)
			);

			const existingRelationshipReverse = await db.select().from(relationshipsTable).where(
				and(
					eq(relationshipsTable.user1Id, user2.id),
					eq(relationshipsTable.user2Id, body.user1Id)
				)
			);

			const now = new Date().toISOString();
			console.log(now,"as");
			
			// If relationship exists
			if (existingRelationship.length > 0) {
				const existing = existingRelationship[0];
				if (existing.deleted) {
					// Reconnect - update deleted to false and reset startedAt
					const [reconnected] = await db.update(relationshipsTable)
						.set({ 
							deleted: false, 
							startedAt: new Date(now),
							updatedAt: new Date(now)
						})
						.where(eq(relationshipsTable.id, existing.id))
						.returning();
					return c.json({ 
						success: true, 
						data: { ...reconnected, user1, user2 },
						message: 'Relationship reconnected successfully'
					});
				} else {
					// Already connected
					return c.json({ 
						success: false, 
						message: 'Relationship already exists',
						data: { ...existing, user1, user2 }
					}, 409);
				}
			}

			if (existingRelationshipReverse.length > 0) {
				const existing = existingRelationshipReverse[0];
				if (existing.deleted) {
					// Reconnect - update deleted to false and reset startedAt
					// const new Date(now) = new Date().toISOString();
					const [reconnected] = await db.update(relationshipsTable)
						.set({ 
							deleted: false, 
							startedAt: new Date(now),
							updatedAt: new Date(now)
						})
						.where(eq(relationshipsTable.id, existing.id))
						.returning();
					return c.json({ 
						success: true, 
						data: { ...reconnected, user1, user2 },
						message: 'Relationship reconnected successfully'
					});
				} else {
					// Already connected
					return c.json({ 
						success: false, 
						message: 'Relationship already exists',
						data: { ...existing, user1, user2 }
					}, 409);
				}
			}

			// const new Date(now) = new Date().toISOString();
			const relationshipData = {
                user1Id: body.user1Id,
				user2Id: user2.id,
				startedAt: new Date(now)
			};
			const [relationship] = await db.insert(relationshipsTable).values(relationshipData).returning();
			return c.json({ 
				success: true, 
				data: { ...relationship, user1, user2 },
				message: 'Relationship created successfully'
			});
		} catch (err) {
			return c.json({ error: 'Failed to create relationship', detail: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}
