
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { dailyAppOpensTable } from '../../db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

export class RecordAppOpenPost extends OpenAPIRoute {
	schema = {
		tags: ["Streak"],
		summary: "Record user app open for daily streak",
		request: {
			body: {
				content: {
					"application/json": {
						schema: z.object({
							userId: z.number().describe("User ID")
						})
					}
				}
			}
		},
		responses: {
			"200": {
				description: "App open recorded successfully",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							message: z.string(),
							alreadyOpenedToday: z.boolean()
						})
					}
				}
			},
			"400": {
				description: "Missing userId",
				content: {
					"application/json": {
						schema: z.object({ success: z.literal(false), message: z.string() })
					}
				}
			}
		}
	};

	async handle(c) {
		const db = c.get('db');
		const body = await c.req.json();
		const userId = body.userId;

		if (!userId) {
			return c.json({ success: false, message: 'Missing userId' }, 400);
		}

		// Check if user already opened app today
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const endOfDay = new Date(today);
		endOfDay.setHours(23, 59, 59, 999);

		const existingOpen = await db
			.select()
			.from(dailyAppOpensTable)
			.where(and(
				eq(dailyAppOpensTable.userId, userId),
				gte(dailyAppOpensTable.openedAt, today),
				lt(dailyAppOpensTable.openedAt, endOfDay)
			));

		if (existingOpen.length > 0) {
			return c.json({
				success: true,
				message: 'Already opened app today',
				alreadyOpenedToday: true
			});
		}

		// Record new app open
		await db.insert(dailyAppOpensTable).values({
			userId: userId,
			openedAt: new Date()
		});

		return c.json({
			success: true,
			message: 'App open recorded successfully',
			alreadyOpenedToday: false
		});
	}
}
