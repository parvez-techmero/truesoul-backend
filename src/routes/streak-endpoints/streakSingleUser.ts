
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { dailyAppOpensTable } from '../../db/schema';
import { and, eq, gte, lt } from 'drizzle-orm';

// Helper to get all dates of current week (Monday-Sunday)
function getCurrentWeekDates() {
	const today = new Date();
	const dayOfWeek = today.getDay(); // 0 (Sun) - 6 (Sat)
	// Adjust so week starts on Monday
	const monday = new Date(today);
	monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
	const dates = [];
	for (let i = 0; i < 7; i++) {
		const d = new Date(monday);
		d.setDate(monday.getDate() + i);
		dates.push(new Date(d));
	}
	return dates;
}

export class StreakSingleUserGet extends OpenAPIRoute {
	schema = {
		tags: ["Streak"],
		summary: "Get single user's weekly streak and record app open",
		request: {
			query: z.object({
				userId: Num().describe("User ID to get streak for")
			})
		},
		responses: {
			"200": {
				description: "Weekly streak response based on app opens with app open recording",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.object({
								message: z.string(),
								streak: z.number(),
								dates: z.array(z.object({
									date: z.string(),
									canAnswerToday: z.boolean(),
									streak: z.boolean()
								})),
								alreadyOpenedToday: z.boolean()
							})
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
		const userId = Number(c.req.query('userId'));
		if (!userId) {
			return c.json({ success: false, message: 'Missing userId' }, 400);
		}

		// Check if user already opened app today and record if not
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

		let alreadyOpenedToday = existingOpen.length > 0;
		let message = '';

		if (!alreadyOpenedToday) {
			// Record new app open
			await db.insert(dailyAppOpensTable).values({
				userId: userId,
				openedAt: new Date()
			});
			alreadyOpenedToday = true; // Update status after recording
			message = 'App open recorded successfully';
		} else {
			message = 'Already opened app today';
		}

		// Get weekly streak data
		const weekDates = getCurrentWeekDates();
		const dateResults = [];

		for (const dateObj of weekDates) {
			// Get start/end of day
			const start = new Date(dateObj);
			start.setHours(0, 0, 0, 0);
			const end = new Date(dateObj);
			end.setHours(23, 59, 59, 999);

			// Query for any app open on this day
			const appOpens = await db
				.select()
				.from(dailyAppOpensTable)
				.where(and(
					eq(dailyAppOpensTable.userId, userId),
					gte(dailyAppOpensTable.openedAt, start),
					lt(dailyAppOpensTable.openedAt, end)
				));

			// canAnswerToday is true if no app open yet for this day
			dateResults.push({
				date: start.toISOString().slice(0, 10),
				canAnswerToday: appOpens.length === 0,
				streak: appOpens.length > 0
			});
		}

		// Calculate streak count (consecutive days with app opens)
		let streakCount = 0;
		const todayDate = new Date().toISOString().slice(0, 10);
		
		// Find today's index in dateResults
		const todayIndex = dateResults.findIndex(d => d.date === todayDate);
		
		// Count backwards from today (or yesterday if today hasn't been opened yet) for consecutive streak
		if (todayIndex >= 0) {
			// Start from today if opened, otherwise start from yesterday
			let startIndex = dateResults[todayIndex].streak ? todayIndex : todayIndex - 1;
			
			// Count consecutive days with streak
			for (let i = startIndex; i >= 0; i--) {
				if (dateResults[i].streak) {
					streakCount++;
				} else {
					break;
				}
			}
		}

		return c.json({
			success: true,
			data: {
				message,
				streak: streakCount,
				dates: dateResults,
				alreadyOpenedToday
			}
		});
	}
}
