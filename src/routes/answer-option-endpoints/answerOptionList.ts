import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { answerOptionsTable } from '../../db/schema';

export class AnswerOptionList extends OpenAPIRoute {
  schema = {
    tags: ["AnswerOption"],
    summary: "List Answer Options",
    responses: {
      "200": {
        description: "Returns a list of Answer Options",
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
    try {
      const answerOptions = await db.select().from(answerOptionsTable);
      return c.json({ success: true, data: answerOptions });
    } catch (err) {
      return c.json({ error: 'Failed to fetch answer options', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
