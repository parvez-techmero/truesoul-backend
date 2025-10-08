import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable, relationshipsTable, subTopicsTable, usersTable, questionsTable, journalTable, dailyAppOpensTable } from '../../db/schema';
import { eq, and, inArray, name } from 'drizzle-orm';

export class HomeGet extends OpenAPIRoute {
	schema = {
		tags: ["Home"],
		summary: "Get HomeScreen Data",
		request: {
			query: z.object({
				relationshipId: Num().optional(),
				userId: Num().optional()
			}),
		},
		responses: {
			"200": {
				description: "Returns results for both users or a single user",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.array(z.any()),
							match: z.string().optional(),
							subtopic: z.string().optional(),
						}),
					},
				},
			},
			"404": {
				description: "No results found",
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
		const { query } = await this.getValidatedData<typeof this.schema>();
		const { relationshipId, userId } = query;
		if (!relationshipId && !userId) {
			return c.json({ success: false, message: "Either relationshipId or userId must be provided" }, 400);
		}
		const db = c.get('db');
		try {
			// const [subtopic] = await db
			// 	.select()
			// 	.from(subTopicsTable)
			// 	.where(eq(subTopicsTable.id, subTopicId));

			// if (!subtopic) {
			// 	return c.json({ success: false, message: 'SubTopic not found' }, 404);
			// }

			// const questions = await db
			// 	.select()
			// 	.from(questionsTable)
			// 	.where(eq(questionsTable.subTopicId, subtopic.id));

			// if (!questions || !questions.length) {
			// 	return c.json({ success: true, results: [] });
			// }


			if (relationshipId) {
				const [relation] = await db
					.select()
					.from(relationshipsTable)
					.where(eq(relationshipsTable.id, relationshipId));

				if (!relation) {
					return c.json({ success: false, message: 'Relationship not found' }, 404);
				}

				// Check if relationship is disconnected
				const isDisconnected = relation.deleted;
				
				// Only include both users if relationship is connected
				const userIds = isDisconnected ? [relation.user1Id] : [relation.user1Id, relation.user2Id].filter(Boolean);

                const [user1] = await db
                    .select({
                        name: usersTable.name,
                        id: usersTable.id,
                        profileImg: usersTable.profileImg,
                        mood: usersTable.mood
                    })
                    .from(usersTable)
                    .where(and(eq(usersTable.id, relation.user1Id), eq(usersTable.deleted, false)));

				// Only fetch user2 if relationship is connected
                const user2 = isDisconnected ? null : await db
                    .select({
                        name: usersTable.name,
                        id: usersTable.id,
                        profileImg: usersTable.profileImg,
                        mood: usersTable.mood
                    })
                    .from(usersTable)
                    .where(and(eq(usersTable.id, relation.user2Id), eq(usersTable.deleted, false)))
					.then(result => result[0] || null);

                console.log(user1,user2);
                
                console.log(userIds,"Asd");
                
				// Days together
				let daysTogether = null;
				if (relation.startedAt || relation.createdAt) {
					const startedDate = new Date(relation.startedAt || relation.createdAt);
					const today = new Date();
					// Set both dates to midnight UTC
					const startedUTC = Date.UTC(startedDate.getUTCFullYear(), startedDate.getUTCMonth(), startedDate.getUTCDate());
					const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
					daysTogether = Math.floor((todayUTC - startedUTC) / (1000 * 60 * 60 * 24));
				}

				// Memories and special days
				const memories = await db
					.select()
					.from(journalTable)
					.where(and(eq(journalTable.relationshipId, relationshipId), eq(journalTable.type, "memory")));
				const specialDays = await db
					.select()
					.from(journalTable)
					.where(and(eq(journalTable.relationshipId, relationshipId), eq(journalTable.type, "special_day")));

				// Cities visited
				const cities = await db
					.select({ location: journalTable.location })
					.from(journalTable)
					.where(eq(journalTable.relationshipId, relationshipId));
				const uniqueCities = Array.from(new Set(cities.map(j => j.location).filter(Boolean)));

				// Countries visited (if available)
				// If you have a country field, use it. Otherwise, skip or infer from location.
				// For now, we'll skip country extraction.

				// Question answered percentage
				const totalQuestions = await db
					.select()
					.from(questionsTable);
				const answeredQuestions = await db
					.select()
					.from(userAnswersTable)
					.where(inArray(userAnswersTable.userId, userIds));
				const questionAnsweredPercentage = totalQuestions.length > 0 ? Math.round((answeredQuestions.length / (totalQuestions.length * userIds.length)) * 100) : 0;

			// Daily streak calculation for both users (based on app opens)
			async function getDailyStreak(userId: number) {
				const appOpens = await db
					.select({ openedAt: dailyAppOpensTable.openedAt })
					.from(dailyAppOpensTable)
					.where(eq(dailyAppOpensTable.userId, userId));
				const days = Array.from(new Set(appOpens.map(a => {
					const d = new Date(a.openedAt as string);
					return d.toISOString().slice(0, 10);
				}))) as string[];
				days.sort((a, b) => b.localeCompare(a)); // Descending
				let streak = 0;
				let current = new Date();
				for (let day of days) {
					const dayDate = new Date(day);
					if (
						dayDate.getUTCFullYear() === current.getUTCFullYear() &&
						dayDate.getUTCMonth() === current.getUTCMonth() &&
						dayDate.getUTCDate() === current.getUTCDate()
					) {
						streak++;
						current.setUTCDate(current.getUTCDate() - 1);
					} else {
						break;
					}
				}
				return streak;
			}				const user1Streak = user1 ? await getDailyStreak(user1.id) : 0;
				// Only calculate user2 streak if relationship is connected
				const user2Streak = (user2 && !isDisconnected) ? await getDailyStreak(user2.id) : 0;

				return c.json({
					success: true,
					data: {
						user1,
						user2: isDisconnected ? null : user2,
						daysTogether: isDisconnected ? null : daysTogether,
						memoriesCreated: memories.length,
						specialDays: specialDays.length,
						citiesVisited: uniqueCities.length,
						countriesVisited: null, // Add logic if country info is available
						questionAnsweredPercentage,
						dailyStreak: {
							user1: user1Streak,
							user2: isDisconnected ? null : user2Streak
						}
					},
				});



			} else if (userId) {

                console.log(userId);
                

                const [user1] = await db
                    .select({
                        name: usersTable.name,
                        id: usersTable.id,
                        profileImg: usersTable.profileImg,
                        mood: usersTable.mood
                    })
                    .from(usersTable)
                    .where(and(eq(usersTable.id, userId)));


                    console.log(user1);
                    
				// For single user, only show their answered questions percentage
				const totalQuestions = await db
					.select()
					.from(questionsTable);
				const answeredQuestions = await db
					.select()
					.from(userAnswersTable)
					.where(eq(userAnswersTable.userId, userId));
				const questionAnsweredPercentage = totalQuestions.length > 0 ? Math.round((answeredQuestions.length / totalQuestions.length) * 100) : 0;

				// Daily streak calculation for single user (based on app opens)
				async function getDailyStreak(userId: number) {
					const appOpens = await db
						.select({ openedAt: dailyAppOpensTable.openedAt })
						.from(dailyAppOpensTable)
						.where(eq(dailyAppOpensTable.userId, userId));
					const days = Array.from(new Set(appOpens.map(a => {
						const d = new Date(a.openedAt as string);
						return d.toISOString().slice(0, 10);
					}))) as string[];
					days.sort((a, b) => b.localeCompare(a)); // Descending
					let streak = 0;
					let current = new Date();
					for (let day of days) {
						const dayDate = new Date(day);
						if (
							dayDate.getUTCFullYear() === current.getUTCFullYear() &&
							dayDate.getUTCMonth() === current.getUTCMonth() &&
							dayDate.getUTCDate() === current.getUTCDate()
						) {
							streak++;
							current.setUTCDate(current.getUTCDate() - 1);
						} else {
							break;
						}
					}
					return streak;
				}

				const dailyStreak = await getDailyStreak(userId);

				return c.json({
					success: true,
					data: {
						user1,
						user2: null,
						daysTogether: null,
						memoriesCreated: null,
						specialDays: null,
						citiesVisited: null,
						countriesVisited: null,
						questionAnsweredPercentage,
						dailyStreak : {
							user1: dailyStreak,
							user2: null
						}
					},
				});
			}
		} catch (err) {
			return c.json({ error: 'Failed to fetch results', detail: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}
