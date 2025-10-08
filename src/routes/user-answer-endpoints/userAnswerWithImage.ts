import { z } from "zod";
// ...existing code...
import { OpenAPIRoute } from "chanfana";
import { userAnswersTable, usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { generateUniqueFilename, validateImageFile } from '../../utils/imageHelper';
import { writeFileSync } from 'fs';
import { join } from 'path';

export class UserAnswerWithImage extends OpenAPIRoute {
  schema = {
    tags: ["UserAnswer"],
    summary: "Bulk Create User Answers with Images",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              userId: z.string(),
              topicId: z.string(),
              answer: z.string(), // JSON stringified array
              // images: handled dynamically
            })
          }
        }
      }
    },
    responses: {
      "200": {
        description: "Returns the created User Answers",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              userAnswers: z.any()
            })
          }
        }
      }
    }
  };

  async handle(c) {
    const formData = await c.req.formData();
    console.log(formData,"formdata");
    
    const userId = Number(formData.get('userId'));
    const topicId = Number(formData.get('topicId'));
    const answers = JSON.parse(formData.get('answer'));
    console.log(answers,"as");
    

    const db = c.get('db');
    // Check user exists
    const user = await db.select().from(usersTable).where(
      and(eq(usersTable.id, userId), eq(usersTable.deleted, false))
    );
    if (!user.length) return c.json({ success: false, error: 'User not found' }, 404);

    // Prepare answers for bulk insert
    const answersToInsert = [];
    for (const ans of answers) {
      let imageUrl = null;
      const imageField = `image_${ans.questionId}`;
      const imageFile = formData.get(imageField);
      if (imageFile && typeof imageFile === 'object') {
        // Validate and save image
        const valid = validateImageFile(imageFile);
        if (!valid.isValid) return c.json({ success: false, error: valid.error }, 400);
        const ext = imageFile.name.split('.').pop();
        const filename = generateUniqueFilename(userId, ext);
        const savePath = join('public/profile-images', filename);
        const arrayBuffer = await imageFile.arrayBuffer();
        writeFileSync(savePath, Buffer.from(arrayBuffer));
        imageUrl = `/profile-images/${filename}`;
      }
      answersToInsert.push({
        userId,
        questionId: ans.questionId,
        answerText: ans.answer,
        topicId,
        answerImage: imageUrl
      });
    }

    const userAnswers = await db.insert(userAnswersTable).values(answersToInsert).returning();
    return c.json({ success: true, userAnswers });
  }
}