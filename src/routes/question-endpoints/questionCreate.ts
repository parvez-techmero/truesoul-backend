import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { questionsTable } from '../../db/schema';
import { createQuestionSchema, questionTypeEnum } from '../../types';

export class QuestionCreate extends OpenAPIRoute {
  schema = {
    tags: ["Question"],
    summary: "Create Question",
    request: {
      body: {
        content: {
          "application/json": {
            schema: createQuestionSchema
            // z.object({
            //   text: z.string(),
            //   type: questionTypeEnum,
            //   subTopicId: z.number(),
            //   subTopicId: z.number(),
            //   subTopicId: z.number(),
            //   explanation: z.string().optional(),
            //   difficulty: z.number().min(1).max(5).optional(),
            //   sortOrder: z.number().optional(),
            //   isActive: z.boolean().optional(),
            // }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Question",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              question: z.any(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const { body } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      console.log('Creating question with data:', body);
      
      const question = await db.insert(questionsTable).values(body).returning();
      return c.json({ success: true, question: question[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create question', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
