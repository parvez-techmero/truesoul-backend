import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { questionsTable } from '../../db/schema';

export class QuestionList extends OpenAPIRoute {
  schema = {
    tags: ["Question"],
    summary: "List Questions",
    responses: {
      "200": {
        description: "Returns a list of Questions",
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
      const questions = await db.select().from(questionsTable);
      return c.json({ success: true, data: questions });
    } catch (err) {
      return c.json({ error: 'Failed to fetch questions', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
