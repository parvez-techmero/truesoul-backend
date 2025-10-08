import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable, relationshipsTable, subTopicsTable, usersTable, questionsTable } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export class ResultGetByRelationshipAndSubtopic extends OpenAPIRoute {
	schema = {
		tags: ["Result"],
		summary: "Get results of both relationship users or a single user according to subtopic",
		request: {
			query: z.object({
				relationshipId: Num().optional(),
				userId: Num().optional(),
				subTopicId: Num(),
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
		const { relationshipId, userId, subTopicId } = query;
		if (!relationshipId && !userId) {
			return c.json({ success: false, message: "Either relationshipId or userId must be provided" }, 400);
		}
		const db = c.get('db');
		try {
			const [subtopic] = await db
				.select()
				.from(subTopicsTable)
				.where(eq(subTopicsTable.id, subTopicId));

			if (!subtopic) {
				return c.json({ success: false, message: 'SubTopic not found' }, 404);
			}

			const questions = await db
				.select()
				.from(questionsTable)
				.where(eq(questionsTable.subTopicId, subtopic.id));

			if (!questions || !questions.length) {
				return c.json({ success: true, results: [] });
			}

			let results = [];

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

				const answers = await db
					.select()
					.from(userAnswersTable)
					.where(
						and(
							inArray(userAnswersTable.userId, userIds),
							inArray(userAnswersTable.questionId, questions.map(q => q.id))
						)
					);

				const answersMap = new Map();
				for (const a of answers) {
					answersMap.set(`${a.userId}-${a.questionId}`, a.answerText);
				}

				const imagesMap = new Map();
				for (const a of answers) {
					imagesMap.set(`${a.userId}-${a.questionId}`, a.answerImage ?? null);
				}

				results = questions.map(q => ({
					questionId: q.id,
					question: q.questionText,
					questionType: q.questionType,
					optionText: q.optionText,
					optionImg: q.optionImg,
					user1Answer: relation.user1Id
						? answersMap.get(`${relation.user1Id}-${q.id}`) ?? null
						: null,
					// Only include user2 data if relationship is connected
					user2Answer: (!isDisconnected && relation.user2Id)
						? answersMap.get(`${relation.user2Id}-${q.id}`) ?? null
						: null,
					user1img: relation.user1Id
						? imagesMap.get(`${relation.user1Id}-${q.id}`) ?? null
						: null,
					// Only include user2 data if relationship is connected
					user2img: (!isDisconnected && relation.user2Id)
						? imagesMap.get(`${relation.user2Id}-${q.id}`) ?? null
						: null,
				}));

				const normalize = (s) => s.trim().toLowerCase();
				let matches = 0;
				let totalCompared = 0;
				for (const r of results) {
					if (r.user1Answer && r.user2Answer) {
						totalCompared++;
						if (normalize(r.user1Answer) === normalize(r.user2Answer)) {
							matches++;
						}
					}
				}

				const similarityPercent =
					totalCompared > 0 ? (matches / totalCompared) * 100 : 0;

				return c.json({
					success: true,
					match: similarityPercent.toFixed(2),
					data: results,
					subtopic: subtopic.name
				});

			} else if (userId) {
				const answers = await db
					.select()
					.from(userAnswersTable)
					.where(
						and(
							eq(userAnswersTable.userId, userId),
							inArray(userAnswersTable.questionId, questions.map(q => q.id))
						)
					);

				const answersMap = new Map();
				for (const a of answers) {
					answersMap.set(`${a.userId}-${a.questionId}`, a.answerText);
				}

				const imagesMap = new Map();
				for (const a of answers) {
					imagesMap.set(`${a.userId}-${a.questionId}`, a.answerImage ?? null);
				}

				results = questions.map(q => ({
					questionId: q.id,
					question: q.questionText,
					questionType: q.questionType,
					optionText: q.optionText,
					optionImg: q.optionImg,
					user1Answer: answersMap.get(`${userId}-${q.id}`) ?? null,
					user1Img: imagesMap.get(`${userId}-${q.id}`) ?? null,
				}));

				return c.json({
					success: true,
					data: results,
					subtopic: subtopic.name
				});
			}
		} catch (err) {
			return c.json({ error: 'Failed to fetch results', detail: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}
