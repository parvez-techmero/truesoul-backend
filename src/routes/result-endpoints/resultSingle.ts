import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { userAnswersTable, relationshipsTable, usersTable, questionsTable } from '../../db/schema';
import { eq, or, and, inArray } from 'drizzle-orm';

export class ResultSingleQuestion extends OpenAPIRoute {
    schema = {
        tags: ["Result"],
        summary: "Get result(s) for a single question for a relationship (both users) or a single user",
        request: {
            query: z.object({
                relationshipId: Num().optional(),
                userId: Num().optional(),
                questionId: Num(),
            }),
        },
        responses: {
            "200": {
                description: "Returns answer(s) for the question",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: z.array(z.any()),
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
        const { relationshipId, userId, questionId } = query;
        if (!relationshipId && !userId) {
            return c.json({ success: false, message: "Either relationshipId or userId must be provided" }, 400);
        }
        const db = c.get('db');
        if (relationshipId) {
            // Get both user IDs from relationship
            const rel = await db.select().from(relationshipsTable).where(eq(relationshipsTable.id, relationshipId));
            if (!rel.length) {
                return c.json({ success: false, message: "Relationship not found" }, 404);
            }
            
            // Check if relationship is disconnected
            const isDisconnected = rel[0].deleted;
            
            // Only include both users if relationship is connected
            const userIds = isDisconnected ? [rel[0].user1Id] : [rel[0].user1Id, rel[0].user2Id];
            
            // Get both users' answers for the question
            const answers = await db
                .select()
                .from(userAnswersTable)
                .where(
                    and(
                        eq(userAnswersTable.questionId, questionId),
                        inArray(userAnswersTable.userId, userIds)
                    )
                );
            if (!answers.length) {
                return c.json({ success: false, message: "No answers found for this question/relationship" }, 404);
            }
            // Format answers - only include user2 if relationship is connected
            const formatted = {
                user1: answers.find(a => a.userId === rel[0].user1Id) || null,
                user2: isDisconnected ? null : (answers.find(a => a.userId === rel[0].user2Id) || null),
            };
            return c.json({ success: true, data: formatted });
        } else if (userId) {
            // Get single user's answer for the question
            const answer = await db
                .select()
                .from(userAnswersTable)
                .where(
                    and(
                        eq(userAnswersTable.questionId, questionId),
                        eq(userAnswersTable.userId, userId)
                    )
                );
            if (!answer.length) {
                return c.json({ success: false, message: "No answer found for this question/user" }, 404);
            }
            const formatted = {
                user1: answer[0] || null,
            };
            return c.json({ success: true, data: formatted });
        }
    }
}
