import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { subTopicsTable, questionsTable } from '../../db/schema';
import { or, eq } from "drizzle-orm";

export class SubTopicWithQuestionsList extends OpenAPIRoute {
    schema = {
        tags: ["SubTopic"],
        summary: "List SubTopics with Questions by topicId or categoryId",
        request: {
            query: z.object({
                topicId: z.string().optional(),
                categoryId: z.string().optional(),
            }),
        },
        responses: {
            "200": {
                description: "Returns a list of SubTopics with their Questions",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            data: z.array(z.any()),
                        }),
                    },
                },
            },
        },
    };

    async handle(c) {
        const db = c.get('db');
        const { query } = await this.getValidatedData<typeof this.schema>();
        const { topicId, categoryId } = query;

        try {
            const conditions = [];
            if (topicId) {
                conditions.push(eq(subTopicsTable.topicId, parseInt(topicId)));
            }
            if (categoryId) {
                conditions.push(eq(subTopicsTable.categoryId, parseInt(categoryId)));
            }

            // let subTopics;
            // if (conditions.length > 0) {
            //     [subTopics] = await db
            //         .select()
            //         .from(subTopicsTable)
            //         .where(or(...conditions));
            // } else {
            //     [subTopics] = await db.select().from(subTopicsTable);
            // }


            // const questions = await db
            //     .select()
            //     .from(questionsTable)
            //     .where(eq(questionsTable.subTopicId, subTopics.id));


            // return c.json({ success: true, data: questions });
            let subTopics;
            if (conditions.length > 0) {
                subTopics = await db
                    .select()
                    .from(subTopicsTable)
                    .where(or(...conditions));
            } else {
                subTopics = await db.select().from(subTopicsTable);
            }

            const subTopicsWithQuestions = await Promise.all(
                subTopics.map(async (subTopic) => {
                    const questions = await db
                        .select()
                        .from(questionsTable)
                        .where(eq(questionsTable.subTopicId, subTopic.id));

                    return { ...subTopic, questions };
                })
            );

            return c.json({ success: true, data: subTopicsWithQuestions });

        } catch (err) {
            return c.json({ error: 'Failed to fetch sub-topics with questions', detail: err instanceof Error ? err.message : String(err) }, 500);
        }
    }
}
