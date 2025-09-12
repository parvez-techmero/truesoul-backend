import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable, relationshipsTable, subTopicsTable, usersTable, questionsTable } from '../../db/schema';
import { eq, and, inArray } from 'drizzle-orm';

export class ResultGetByRelationshipAndSubtopic extends OpenAPIRoute {
	schema = {
		tags: ["Result"],
		summary: "Get results of both relationship users according to subtopic",
		request: {
			query: z.object({
				relationshipId: Num(),
				subTopicId: Num(),
			}),
		},
		responses: {
			"200": {
				description: "Returns results for both users",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							results: z.array(z.any()),
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
		const db = c.get('db');
		try {
			// Find quiz sessions for this relationship and subtopic

			// const [relation] = await db.select().from(relationshipsTable).where(eq(relationshipsTable.id, query.relationshipId));
			// if (!relation) {
			// 	return c.json({ success: false, message: 'Relationship not found' }, 404);
			// }	
			// const [subtopic] = await db.select().from(subTopicsTable).where(eq(subTopicsTable.id, query.subTopicId));
			// if (!subtopic) {
			// 	return c.json({ success: false, message: 'SubTopic not found' }, 404);
			// }

			// const questions = await db.select().from(questionsTable).where(eq(questionsTable.subTopicId, subtopic.id));


			// let results = [];

			// for (const q of questions) {
			// 	const user1Answer = relation.user1Id ? await db.select().from(userAnswersTable).where(and(eq(userAnswersTable.userId, relation.user1Id), eq(userAnswersTable.questionId, q.id))) : [];
			// 	const user2Answer = relation.user2Id ? await db.select().from(userAnswersTable).where(and(eq(userAnswersTable.userId, relation.user2Id), eq(userAnswersTable.questionId, q.id))) : [];

			// 	results.push({
			// 		question: q.questionText,
			// 		user1Answer: user1Answer.length ? user1Answer[0].answerText : null,
			// 		user2Answer: user2Answer.length ? user2Answer[0].answerText : null,
			// 	});

			// }


			// return c.json({ success: true, results });

			const [relation] = await db
				.select()
				.from(relationshipsTable)
				.where(eq(relationshipsTable.id, query.relationshipId));

			if (!relation) {
				return c.json({ success: false, message: 'Relationship not found' }, 404);
			}

			const [subtopic] = await db
				.select()
				.from(subTopicsTable)
				.where(eq(subTopicsTable.id, query.subTopicId));

			if (!subtopic) {
				return c.json({ success: false, message: 'SubTopic not found' }, 404);
			}

			const questions = await db
				.select()
				.from(questionsTable)
				.where(eq(questionsTable.subTopicId, subtopic.id));

			if (!questions.length) {
				return c.json({ success: true, results: [] });
			}

			const userIds = [relation.user1Id, relation.user2Id].filter(Boolean);

			const answers = await db
				.select()
				.from(userAnswersTable)
				.where(
					and(
						inArray(userAnswersTable.userId, userIds),
						inArray(userAnswersTable.questionId, questions.map(q => q.id))
					)
				);

			// organize answers into a lookup
			const answersMap = new Map<
				string, // `${userId}-${questionId}`
				string
			>();
			for (const a of answers) {
				answersMap.set(`${a.userId}-${a.questionId}`, a.answerText);
			}

			const results = questions.map(q => ({
				question: q.questionText,
				user1Answer: relation.user1Id
					? answersMap.get(`${relation.user1Id}-${q.id}`) ?? null
					: null,
				user2Answer: relation.user2Id
					? answersMap.get(`${relation.user2Id}-${q.id}`) ?? null
					: null,
			}));

			// return c.json({ success: true, results });

			// ---- Score calculation ----
			const normalize = (s: string) => s.trim().toLowerCase();
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

			return c.json({ success: true, match : similarityPercent.toFixed(2), results });


		} catch (err) {
			return c.json({ error: 'Failed to fetch results', detail: err instanceof Error ? err.message : String(err) }, 500);
		}
	}
}
