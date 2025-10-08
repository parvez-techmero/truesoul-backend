import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { topicsTable, subTopicsTable, questionsTable, relationshipsTable, userAnswersTable } from '../../db/schema';
import { eq, and, or, desc } from 'drizzle-orm';

export class DailyQuestionsGet extends OpenAPIRoute {
	schema = {
		tags: ["DailyQuestions"],
		summary: "Get Daily Questions grouped by topic and subtopic",
		request: {
			query: z.object({
				relationshipId: z.number().optional(),
				userId: z.number().optional()
			}),
		},
		responses: {
			"200": {
				description: "Returns daily questions",
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
				description: "No questions found",
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
		const { userId, relationshipId } = query;
		if (!relationshipId && !userId) {
			return c.json({ success: false, message: "Either relationshipId or userId must be provided" }, 400);
		}
		const db = c.get('db');
		try {
			// Only fetch topic id 11 and subtopic id 86
			const [topic] = await db.select().from(topicsTable)
				.where(and(eq(topicsTable.id, 11), eq(topicsTable.isActive, true)));
			if (!topic) {
				return c.json({ success: false, message: "Daily topic not found" }, 404);
			}

			const [subtopic] = await db.select().from(subTopicsTable)
				.where(and(eq(subTopicsTable.id, 86), eq(subTopicsTable.isActive, true)));
			if (!subtopic) {
				return c.json({ success: false, message: "Daily subtopic not found" }, 404);
			}

			const questions = await db.select().from(questionsTable)
				.where(and(eq(questionsTable.subTopicId, 86), eq(questionsTable.isActive, true)));

			// Daily question selection logic
			const startDate = new Date("2025-10-01"); // Set your start date here
			const today = new Date();
			const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
			const index = questions.length ? daysSinceStart % questions.length : 0;
			const dailyQuestion = questions[index];

			// If relationshipId is provided, return both users' answer status
			let user1Answered = false;
			let user2Answered = false;
			let user1Id = null;
			let user2Id = null;
			let user1Answer = null;
			let user2Answer = null;
			
			if (relationshipId) {
				const [relationship] = await db.select().from(relationshipsTable)
					.where(eq(relationshipsTable.id, Number(relationshipId)));
				if (relationship) {
					// Check if relationship is disconnected
					const isDisconnected = relationship.deleted;
					
					user1Id = relationship.user1Id;
					user2Id = isDisconnected ? null : relationship.user2Id;
					const [answer1] = await db.select().from(userAnswersTable)
						.where(and(
							eq(userAnswersTable.userId, user1Id),
							eq(userAnswersTable.questionId, dailyQuestion.id)
						))
						.orderBy(desc(userAnswersTable.answeredAt))
						.limit(1);
					
					user1Answered = !!answer1;
					user1Answer = answer1 ? answer1.answerText : null;
					
					// Only fetch user2 data if relationship is connected
					if (!isDisconnected && user2Id) {
						const [answer2] = await db.select().from(userAnswersTable)
							.where(and(
								eq(userAnswersTable.userId, user2Id),
								eq(userAnswersTable.questionId, dailyQuestion.id)
							))
							.orderBy(desc(userAnswersTable.answeredAt))
							.limit(1);
						user2Answered = !!answer2;
						user2Answer = answer2 ? answer2.answerText : null;
					}
				}
			} else if (userId) {
				// Find relationship for user
				const [relationship] = await db.select().from(relationshipsTable)
					.where(and(
						or(
							eq(relationshipsTable.user1Id, Number(userId)),
							eq(relationshipsTable.user2Id, Number(userId))
						),
						eq(relationshipsTable.deleted, false)
					));
				if (relationship) {
					user1Id = relationship.user1Id;
					user2Id = relationship.user2Id;
					const [answer1] = await db.select().from(userAnswersTable)
						.where(and(
							eq(userAnswersTable.userId, user1Id),
							eq(userAnswersTable.questionId, dailyQuestion.id)
						))
						.orderBy(desc(userAnswersTable.answeredAt))
						.limit(1);
					const [answer2] = await db.select().from(userAnswersTable)
						.where(and(
							eq(userAnswersTable.userId, user2Id),
							eq(userAnswersTable.questionId, dailyQuestion.id)
						))
						.orderBy(desc(userAnswersTable.answeredAt))
						.limit(1);
					user1Answered = !!answer1;
					user2Answered = !!answer2;
					user1Answer = answer1 ? answer1.answerText : null;
					user2Answer = answer2 ? answer2.answerText : null;
				} else {
					// Single user, just check their answer
					const [answer] = await db.select().from(userAnswersTable)
						.where(and(
							eq(userAnswersTable.userId, Number(userId)),
							eq(userAnswersTable.questionId, dailyQuestion.id)
						))
						.orderBy(desc(userAnswersTable.answeredAt))
						.limit(1);
					user1Answered = !!answer;
					user1Answer = answer ? answer.answerText : null;
				}
			}

			dailyQuestion.questionType = "user_text";
			dailyQuestion.user1Answered = user1Answered;
			dailyQuestion.user2Answered = user2Answered;
			dailyQuestion.user1Answer = user1Answer;
			dailyQuestion.user2Answer = user2Answer;

			return c.json({ success: true, data: dailyQuestion });
		} catch (err) {
			return c.json({ success: false, message: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}