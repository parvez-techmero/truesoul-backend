
import { OpenAPIRoute, Str, Num } from "chanfana";
import { z } from "zod";
import { journalTable, relationshipsTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { parse } from "path";

export class JournalCreate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Create Journal Entry",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              relationshipId: z.string(),
              createdByUserId: z.string(),
              type: z.enum(["memory", "special_day"]),
              title: z.string(),
              colorCode: z.string().optional(),
              dateTime: z.string().optional(),
              lat: z.string().optional(),
              long: z.string().optional(),
              description: z.string().optional(),
              // images handled dynamically
              location: z.string().optional(),
            })
          }
        }
      },
    },
    responses: {
      "200": {
        description: "Returns the created journal entry",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              journal: z.any(),
            }),
          },
        },
      },
      "404": {
        description: "Relationship not found",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              message: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c) {
    const formData = await c.req.formData();
    const db = c.get('db');
    try {
      // Parse fields
      const relationshipIdRaw = formData.get('relationshipId');
      const createdByUserIdRaw = formData.get('createdByUserId');
      let relationshipId = null;
      let createdByUserId = null;
      if (relationshipIdRaw && Number(relationshipIdRaw) > 0) {
        relationshipId = Number(relationshipIdRaw);
      }
      if (createdByUserIdRaw && Number(createdByUserIdRaw) > 0) {
        createdByUserId = Number(createdByUserIdRaw);
      }
      if (!relationshipId && !createdByUserId) {
        return c.json({ success: false, error: 'Either relationshipId or createdByUserId must be provided.' }, 400);
      }
      const type = formData.get('type');
      const title = formData.get('title');
      const colorCode = formData.get('colorCode') || null;
      const dateTimeRaw = formData.get('dateTime');
      const dateTime = new Date(dateTimeRaw).toISOString();
      const lat = formData.get('lat') || null;
      const long = formData.get('long') || null;
      const description = formData.get('description') || null;
      const location = formData.get('location') || null;

      // Validate relationship exists and is not deleted
      // const relationship = await db.select().from(relationshipsTable).where(and(eq(relationshipsTable.id, relationshipId), eq(relationshipsTable.deleted, false)));
      // if (!relationship.length) {
      //   return c.json({ success: false, message: 'Relationship not found' }, 404);
      // }
      // // Validate createdByUserId is part of relationship
      // if (createdByUserId !== relationship[0].user1Id && createdByUserId !== relationship[0].user2Id) {
      //   return c.json({ success: false, message: 'User is not part of this relationship' }, 400);
      // }

      // Handle multiple images
      const imagePaths: string[] = [];
      for (const entry of formData.entries()) {
        const [key, value] = entry;
        if (key.startsWith('image') && typeof value === 'object' && value.name) {
          // Validate and save image (reuse your imageHelper if needed)
          // You may want to add validation here
          const ext = value.name.split('.').pop();
          const filename = `${relationshipId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const savePath = require('path').join('public/profile-images', filename);
          const arrayBuffer = await value.arrayBuffer();
          require('fs').writeFileSync(savePath, Buffer.from(arrayBuffer));
          imagePaths.push(`/profile-images/${filename}`);
        }
      }

      // Store image paths as JSON string (or comma-separated if preferred)
      const images = JSON.stringify(imagePaths);

      let dt = new Date(dateTime);
      const journalData = {
        relationshipId,
        createdByUserId,
        type,
        title,
        colorCode,
        dateTime: dt,
        location,
        lat: parseFloat(lat) || null,
        long: parseFloat(long) || null,
        description,
        images
      };
      console.log(journalData, "Adas");

      const journal = await db.insert(journalTable).values(journalData).returning();
      return c.json({ success: true, journal: journal[0] });
    } catch (err) {
      console.log(err);

      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
