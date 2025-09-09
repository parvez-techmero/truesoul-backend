import { OpenAPIRoute, Num } from "chanfana";
import { z } from "zod";
import { questionsTable } from '../../db/schema';
import { questionTypeEnum } from '../../types';
import { eq } from 'drizzle-orm';

export class QuestionUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Question"],
    summary: "Update Question",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              text: z.string().optional(),
              type: questionTypeEnum.optional(),
              subTopicId: z.number().optional(),
              explanation: z.string().optional(),
              difficulty: z.number().min(1).max(5).optional(),
              sortOrder: z.number().optional(),
              isActive: z.boolean().optional(),
            }),
          },
        },
      },
      params: z.object({
        id: Num(),
      }),
    },
    responses: {
      "200": {
        description: "Returns the updated Question",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              question: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Question not found",
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
    const { body, params } = await this.getValidatedData<typeof this.schema>();
    const db = c.get('db');
    try {
      const updated = await db.update(questionsTable).set(body).where(eq(questionsTable.id, params.id)).returning();
      if (!updated.length) {
        return c.json({ success: false, message: 'Question not found' }, 404);
      }
      return c.json({ success: true, question: updated[0] });
    } catch (err) {
      return c.json({ error: 'Failed to update question', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
