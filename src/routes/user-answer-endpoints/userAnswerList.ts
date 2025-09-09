import { OpenAPIRoute, Bool } from "chanfana";
import { z } from "zod";
import { userAnswersTable } from '../../db/schema';

export class UserAnswerList extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "List User Answers",
    responses: {
      "200": {
        description: "Returns a list of User Answers",
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
      const userAnswers = await db.select().from(userAnswersTable);
      return c.json({ success: true, data: userAnswers });
    } catch (err) {
      return c.json({ error: 'Failed to fetch user answers', detail: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
