
import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { subTopicsTable, questionsTable, userAnswersTable, relationshipsTable, activeRandomSubtopicsTable, usersTable } from '../../db/schema';
import { eq, and, or, inArray, desc } from 'drizzle-orm';

export class RandomSubTopicsGet extends OpenAPIRoute {
	schema = {
		tags: ["Home"],
		summary: "Get 5 random subtopics with user(s) answer completion status",
		request: {
			query: z.object({
				relationshipId: Num().optional(),
				userId: Num().optional()
			}),
		},
		responses: {
			"200": {
				description: "Returns 5 random subtopics with completion status",
				content: {
					"application/json": {
						schema: z.object({
							success: z.boolean(),
							data: z.array(z.any()),
						}),
					},
				},
			},
			"400": {
				description: "Missing parameters",
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

			let userIds: number[] = [];
			let activeSetWhere;
			let primaryUserId: number;
			
			if (relationshipId) {
				const [relation] = await db.select().from(relationshipsTable).where(eq(relationshipsTable.id, relationshipId));
				if (!relation) {
					return c.json({ success: false, message: "Relationship not found" }, 400);
				}
				
				// Check if relationship is disconnected
				const isDisconnected = relation.deleted;
				
				// Only include both users if relationship is connected
				userIds = isDisconnected ? [relation.user1Id] : [relation.user1Id, relation.user2Id].filter(Boolean);
				primaryUserId = relation.user1Id; // Use first user for hideContent check
				activeSetWhere = eq(activeRandomSubtopicsTable.relationshipId, relationshipId);
			} else if (userId) {
				userIds = [userId];
				primaryUserId = userId;
				activeSetWhere = eq(activeRandomSubtopicsTable.userId, userId);
			}
			
			// Get user's hideContent setting
			const [user] = await db.select({ hideContent: usersTable.hideContent })
				.from(usersTable)
				.where(eq(usersTable.id, primaryUserId));

			// Try to get active set
			let [activeSet] = await db.select().from(activeRandomSubtopicsTable).where(activeSetWhere).orderBy(desc(activeRandomSubtopicsTable.createdAt)).limit(1);
			let subtopicIds: number[] = [];
			let needNewSet = false;
			if (activeSet) {
				subtopicIds = activeSet.subtopicIds.split(',').map(Number);
				// Check if all subtopics are completed for all users
				let allCompleted = true;
				for (const subtopicId of subtopicIds) {
					const questions = await db.select().from(questionsTable).where(and(eq(questionsTable.subTopicId, subtopicId), eq(questionsTable.isActive, true)));
					const questionIds = questions.map(q => q.id);
					if (!questionIds.length) continue;
					for (const uid of userIds) {
						const answers = await db.select().from(userAnswersTable)
							.where(and(inArray(userAnswersTable.questionId, questionIds), eq(userAnswersTable.userId, uid), eq(userAnswersTable.answerStatus, 'complete')));
						if (answers.length < questionIds.length) {
							allCompleted = false;
							break;
						}
					}
					if (!allCompleted) break;
				}
				if (allCompleted) needNewSet = true;
			} else {
				needNewSet = true;
			}

		if (needNewSet) {
			// Get 5 random subtopics (filter adult content if hideContent is true)
			const subtopicConditions = [eq(subTopicsTable.isActive, true)];
			
			if (user?.hideContent) {
				subtopicConditions.push(eq(subTopicsTable.adult, false));
			}
			
			const subtopics = await db.select().from(subTopicsTable).where(and(...subtopicConditions));
			const shuffled = subtopics.sort(() => 0.5 - Math.random());
			const selected = shuffled.slice(0, 5);
			subtopicIds = selected.map(s => s.id);
			// Store new set
			await db.insert(activeRandomSubtopicsTable).values({
				relationshipId: relationshipId || null,
				userId: userId || null,
				subtopicIds: subtopicIds.join(','),
			});
		}			// For each subtopic, get total questions and answered questions for user(s)
			const results = [];
					for (const subtopicId of subtopicIds) {
								const [subtopic] = await db.select().from(subTopicsTable).where(eq(subTopicsTable.id, subtopicId));
								if (!subtopic) continue;
										let categoryName = null;
										let categoryId = subtopic.categoryId || null;
										if (subtopic.categoryId) {
											const [category] = await db.select().from(require('../../db/schema').categoriesTable).where(eq(require('../../db/schema').categoriesTable.id, subtopic.categoryId));
											if (category) categoryName = category.name;
										}
						const questions = await db.select().from(questionsTable).where(and(eq(questionsTable.subTopicId, subtopic.id), eq(questionsTable.isActive, true)));
						const questionIds = questions.map(q => q.id);
						let answeredCount = 0;
						let user1Completed = null;
						let user2Completed = null;
						let userCompleted = null;
						let allUsersCompleted = true;
						if (questionIds.length && userIds.length) {
							const answers = await db.select().from(userAnswersTable)
								.where(and(inArray(userAnswersTable.questionId, questionIds), inArray(userAnswersTable.userId, userIds), eq(userAnswersTable.answerStatus, 'complete')));
							answeredCount = answers.length;
							if (userIds.length === 2) {
								// Relationship
								const user1Id = userIds[0];
								const user2Id = userIds[1];
								const user1Answers = answers.filter(a => a.userId === user1Id);
								const user2Answers = answers.filter(a => a.userId === user2Id);
								user1Completed = user1Answers.length === questionIds.length;
								user2Completed = user2Answers.length === questionIds.length;
								allUsersCompleted = user1Completed && user2Completed;
							} else if (userIds.length === 1) {
								// Single user
								const userId = userIds[0];
								const userAnswers = answers.filter(a => a.userId === userId);
								userCompleted = userAnswers.length === questionIds.length;
								allUsersCompleted = userCompleted;
							}
						} else {
							allUsersCompleted = false;
							if (userIds.length === 2) {
								user1Completed = false;
								user2Completed = false;
							} else if (userIds.length === 1) {
								userCompleted = false;
							}
						}
												// Calculate progress and answered counts
												let userAnsweredCount = 0;
												let partnerAnsweredCount = 0;
												let userProgress = 0;
												let partnerProgress = 0;
												let overallProgress = 0;
												let status = "unanswered";
												let isCompleted = false;
												let topicName = null;
												let topicId = subtopic.topicId || null;
												// Get topic name if available
												if (subtopic.topicId) {
													const [topic] = await db.select().from(require('../../db/schema').topicsTable).where(eq(require('../../db/schema').topicsTable.id, subtopic.topicId));
													if (topic) topicName = topic.name;
												}
												if (userIds.length === 2) {
													const user1Id = userIds[0];
													const user2Id = userIds[1];
													const user1Answers = await db.select().from(userAnswersTable)
														.where(and(inArray(userAnswersTable.questionId, questionIds), eq(userAnswersTable.userId, user1Id), eq(userAnswersTable.answerStatus, 'complete')));
													const user2Answers = await db.select().from(userAnswersTable)
														.where(and(inArray(userAnswersTable.questionId, questionIds), eq(userAnswersTable.userId, user2Id), eq(userAnswersTable.answerStatus, 'complete')));
													userAnsweredCount = user1Answers.length;
													partnerAnsweredCount = user2Answers.length;
													userProgress = questionIds.length ? Math.round((userAnsweredCount / questionIds.length) * 100) : 0;
													partnerProgress = questionIds.length ? Math.round((partnerAnsweredCount / questionIds.length) * 100) : 0;
													overallProgress = questionIds.length ? Math.round(((userAnsweredCount + partnerAnsweredCount) / (questionIds.length * 2)) * 100) : 0;
													isCompleted = (userAnsweredCount === questionIds.length) && (partnerAnsweredCount === questionIds.length);
													status = isCompleted ? "completed" : (userAnsweredCount > 0 || partnerAnsweredCount > 0 ? "in_progress" : "unanswered");
												} else if (userIds.length === 1) {
													const userId = userIds[0];
													const userAnswers = await db.select().from(userAnswersTable)
														.where(and(inArray(userAnswersTable.questionId, questionIds), eq(userAnswersTable.userId, userId), eq(userAnswersTable.answerStatus, 'complete')));
													userAnsweredCount = userAnswers.length;
													userProgress = questionIds.length ? Math.round((userAnsweredCount / questionIds.length) * 100) : 0;
													overallProgress = userProgress;
													isCompleted = userAnsweredCount === questionIds.length;
													status = isCompleted ? "completed" : (userAnsweredCount > 0 ? "in_progress" : "unanswered");
												}
												results.push({
													color: subtopic.color,
													status,
													isCompleted,
													categoryName,
													icon: subtopic.icon,
													topicName,
													sortOrder: subtopic.sortOrder,
													topicId,
													isActive: subtopic.isActive,
													createdAt: subtopic.createdAt,
													name: subtopic.name,
													updatedAt: subtopic.updatedAt,
													totalQuestions: questionIds.length,
													id: subtopic.id,
													adult: subtopic.adult,
													userProgress,
													partnerProgress,
													overallProgress,
													partnerAnsweredCount,
													userAnsweredCount,
													categoryId,
													description: subtopic.description
												});
					}

					return c.json({ success: true, data: results });
	}
}
