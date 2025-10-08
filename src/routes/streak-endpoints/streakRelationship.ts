import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { dailyAppOpensTable, relationshipsTable, usersTable } from '../../db/schema';
import { and, eq, gte, lt, inArray, sql } from 'drizzle-orm';

// Helper to get start of day
function getStartOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	return d;
}

// Helper to get end of day
function getEndOfDay(date: Date): Date {
	const d = new Date(date);
	d.setHours(23, 59, 59, 999);
	return d;
}

// Helper to get all dates in a specific month or current month
// monthParam format: "MM-YYYY" (e.g., "01-2025" for January 2025)
function getMonthDates(monthParam?: string) {
	let year: number;
	let month: number; // 0-based (0 = January, 11 = December)
	
	if (monthParam) {
		// Parse "MM-YYYY" format
		const parts = monthParam.split('-');
		if (parts.length !== 2) {
			throw new Error('Invalid month format. Expected MM-YYYY');
		}
		const monthNum = parseInt(parts[0]);
		const yearNum = parseInt(parts[1]);
		
		if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
			throw new Error('Invalid month or year value');
		}
		
		month = monthNum - 1; // Convert to 0-based
		year = yearNum;
	} else {
		// Use current month
		const today = new Date();
		year = today.getFullYear();
		month = today.getMonth();
	}
	
	// Get first day of month
	const firstDay = new Date(year, month, 1);
	
	// Get last day of month
	const lastDay = new Date(year, month + 1, 0);
	
	const dates = [];
	for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
		dates.push(new Date(d));
	}
	
	return {
		dates,
		monthName: firstDay.toLocaleString('en-US', { month: 'long' }),
		year
	};
}

// Helper to calculate streak count
async function calculateStreak(db: any, userId: number): Promise<number> {
	const today = new Date();
	let streakCount = 0;
	let currentDate = new Date(today);
	
	// Check if user opened app today
	const todayStart = getStartOfDay(currentDate);
	const todayEnd = getEndOfDay(currentDate);
	
	const todayOpen = await db
		.select()
		.from(dailyAppOpensTable)
		.where(and(
			eq(dailyAppOpensTable.userId, userId),
			gte(dailyAppOpensTable.openedAt, todayStart),
			lt(dailyAppOpensTable.openedAt, todayEnd)
		));
	
	// If not opened today, start checking from yesterday
	if (todayOpen.length === 0) {
		currentDate.setDate(currentDate.getDate() - 1);
	}
	
	// Count consecutive days backward
	while (true) {
		const start = getStartOfDay(currentDate);
		const end = getEndOfDay(currentDate);
		
		const appOpens = await db
			.select()
			.from(dailyAppOpensTable)
			.where(and(
				eq(dailyAppOpensTable.userId, userId),
				gte(dailyAppOpensTable.openedAt, start),
				lt(dailyAppOpensTable.openedAt, end)
			));
		
		if (appOpens.length > 0) {
			streakCount++;
			currentDate.setDate(currentDate.getDate() - 1);
		} else {
			break;
		}
	}
	
	return streakCount;
}

export class StreakRelationshipGet extends OpenAPIRoute {
	schema = {
		tags: ["Streak"],
		summary: "Get streak data with calendar and freeze info (for relationship or single user)",
		request: {
			query: z.object({
				relationshipId: Num().optional().describe("Relationship ID to get streak for"),
				userId: Num().optional().describe("User ID to get streak for (if not in a relationship)"),
				month: z.string().optional().describe("Month filter in MM-YYYY format (e.g., 01-2025 for January 2025). Defaults to current month if not provided.")
			})
		},
		responses: {
			"200": {
				description: "Comprehensive streak response for relationship",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.object({
								currentStreak: z.number().describe("Current combined streak count in days"),
								message: z.string().describe("Message about today's challenge"),
								user1: z.object({
									id: z.number(),
									name: z.string().nullable(),
									profileImg: z.string().nullable(),
									streakCount: z.number()
								}),
								user2: z.object({
									id: z.number(),
									name: z.string().nullable(),
									profileImg: z.string().nullable(),
									streakCount: z.number()
								}).nullable().describe("Null for single user mode"),
								freezeAvailable: z.number().describe("Number of freezes available (1 per month)"),
								calendar: z.object({
									month: z.string(),
									year: z.number(),
									days: z.array(z.object({
										date: z.string(),
										dayOfMonth: z.number(),
										dayOfWeek: z.string(),
										user1Opened: z.boolean(),
										user2Opened: z.boolean().nullable().describe("Null for single user mode"),
										bothOpened: z.boolean().describe("For single user: same as user1Opened"),
										isToday: z.boolean(),
										isFuture: z.boolean()
									}))
								}),
								todayCompleted: z.boolean().describe("Whether both users opened app today")
							})
						})
					}
				}
			},
			"400": {
				description: "Missing relationshipId or userId",
				content: {
					"application/json": {
						schema: z.object({ success: z.literal(false), message: z.string() })
					}
				}
			},
			"404": {
				description: "Relationship not found",
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
		const { query } = await this.getValidatedData<typeof this.schema>();
		const { relationshipId, userId, month } = query;
		
		if (!relationshipId && !userId) {
			return c.json({ success: false, message: 'Either relationshipId or userId must be provided' }, 400);
		}

		let user1Id: number;
		let user2Id: number | null = null;
		let isRelationship = false;
		let isDisconnected = false;

		if (relationshipId) {
			// Get relationship - include deleted relationships to check connection status
			const relationship = await db
				.select()
				.from(relationshipsTable)
				.where(eq(relationshipsTable.id, relationshipId));

			if (relationship.length === 0) {
				return c.json({ success: false, message: 'Relationship not found' }, 404);
			}

			// Check if relationship is disconnected
			isDisconnected = relationship[0].deleted;

			user1Id = relationship[0].user1Id;
			// Only set user2Id if relationship is connected
			user2Id = isDisconnected ? null : relationship[0].user2Id;
			isRelationship = !isDisconnected;
		} else if (userId) {
			// Single user mode
			user1Id = userId;
			user2Id = null;
			isRelationship = false;
		} else {
			return c.json({ success: false, message: 'Either relationshipId or userId must be provided' }, 400);
		}

		// Get users based on mode
		const userIdsToFetch = user2Id ? [user1Id, user2Id] : [user1Id];
		const users = await db
			.select()
			.from(usersTable)
			.where(inArray(usersTable.id, userIdsToFetch));

		// Calculate individual streaks
		const user1Streak = await calculateStreak(db, user1Id);
		const user2Streak = user2Id ? await calculateStreak(db, user2Id) : 0;

		// Format user data
		const user1Data = users.find(u => u.id === user1Id);
		const user2Data = user2Id ? users.find(u => u.id === user2Id) : null;

		const user1Object = {
			id: user1Data?.id || user1Id,
			name: user1Data?.name || null,
			profileImg: user1Data?.profileImg || null,
			streakCount: user1Streak
		};

		const user2Object = user2Data ? {
			id: user2Data.id,
			name: user2Data.name || null,
			profileImg: user2Data.profileImg || null,
			streakCount: user2Streak
		} : null;

		// Check if users opened app today
		const today = new Date();
		const todayStart = getStartOfDay(today);
		const todayEnd = getEndOfDay(today);

		const todayOpens = await db
			.select()
			.from(dailyAppOpensTable)
			.where(and(
				inArray(dailyAppOpensTable.userId, userIdsToFetch),
				gte(dailyAppOpensTable.openedAt, todayStart),
				lt(dailyAppOpensTable.openedAt, todayEnd)
			));

		const user1OpenedToday = todayOpens.some(open => open.userId === user1Id);
		const user2OpenedToday = user2Id ? todayOpens.some(open => open.userId === user2Id) : false;
		const bothOpenedToday = isRelationship ? (user1OpenedToday && user2OpenedToday) : user1OpenedToday;

		// Calculate combined streak
		const currentStreak = isRelationship ? Math.min(user1Streak, user2Streak) : user1Streak;

		// Generate message
		let message = bothOpenedToday
			? `Complete today's challenge to level up your streak!`
			: `Complete today's challenge to level up your streak!`;

		// Get calendar data for specified month or current month
		let dates, monthName, yearValue;
		try {
			const monthData = getMonthDates(month);
			dates = monthData.dates;
			monthName = monthData.monthName;
			yearValue = monthData.year;
		} catch (error) {
			return c.json({ 
				success: false, 
				message: error instanceof Error ? error.message : 'Invalid month parameter' 
			}, 400);
		}
		const calendarDays = [];

		for (const dateObj of dates) {
			const start = getStartOfDay(dateObj);
			const end = getEndOfDay(dateObj);
			const dateStr = dateObj.toISOString().slice(0, 10);
			const isToday = dateStr === today.toISOString().slice(0, 10);
			const isFuture = dateObj > today;

			// Get app opens for users on this day
			const dayOpens = await db
				.select()
				.from(dailyAppOpensTable)
				.where(and(
					inArray(dailyAppOpensTable.userId, userIdsToFetch),
					gte(dailyAppOpensTable.openedAt, start),
					lt(dailyAppOpensTable.openedAt, end)
				));

			const user1Opened = dayOpens.some(open => open.userId === user1Id);
			const user2Opened = user2Id ? dayOpens.some(open => open.userId === user2Id) : false;

			calendarDays.push({
				date: dateStr,
				dayOfMonth: dateObj.getDate(),
				dayOfWeek: dateObj.toLocaleString('en-US', { weekday: 'short' }),
				user1Opened,
				user2Opened: isRelationship ? user2Opened : null,
				bothOpened: isRelationship ? (user1Opened && user2Opened) : user1Opened,
				isToday,
				isFuture
			});
		}

		// Calculate freeze availability (1 per month)
		// For now, simple logic: 0 available (can be enhanced with freeze usage tracking)
		const freezeAvailable = 0;

		return c.json({
			success: true,
			data: {
				currentStreak,
				message,
				user1: user1Object,
				user2: user2Object,
				freezeAvailable,
				calendar: {
					month: monthName,
					year: yearValue,
					days: calendarDays
				},
				todayCompleted: bothOpenedToday
			}
		});
	}
}
