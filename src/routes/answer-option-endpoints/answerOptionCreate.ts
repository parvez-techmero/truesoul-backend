import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { answerOptionsTable } from '../../db/schema';

export class AnswerOptionCreate extends OpenAPIRoute {
  schema = {
    tags: ["AnswerOption"],
    summary: "Create Answer Option",
    request: {
      body: {
        content: {
          "application/json": {
            schema: z.object({
              questionId: z.number(),
              text: z.string(),
              isCorrect: z.boolean().optional(),
              sortOrder: z.number().optional(),
              isActive: z.boolean().optional(),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Returns the created Answer Option",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              answerOption: z.any(),
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
      const answerOption = await db.insert(answerOptionsTable).values(body).returning();
      return c.json({ success: true, answerOption: answerOption[0] });
    } catch (err) {
      return c.json({ error: 'Failed to create answer option', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
