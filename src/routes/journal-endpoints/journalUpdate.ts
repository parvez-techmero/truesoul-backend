
import { OpenAPIRoute, Num, Str } from "chanfana";
import { z } from "zod";
import { journalTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

function cleanImagePath(str) {
  // Parse JSON string into array
  const arr = JSON.parse(str);
  // Remove backslashes from each element
  return arr.map(s => s.replace(/\\/g, ""));
}

export class JournalUpdate extends OpenAPIRoute {
  schema = {
    tags: ["Journal"],
    summary: "Update Journal Entry",
    request: {
      body: {
        content: {
          "multipart/form-data": {
            schema: z.object({
              id: z.string(),
              title: z.string().optional(),
              colorCode: z.string().optional(),
              dateTime: z.string().optional(),
              lat: z.string().optional(),
              long: z.string().optional(),
              description: z.string().optional(),
              type: z.enum(["memory", "special_day"]).optional(),
              location: z.string().optional(),
              images: z.any().optional(),
              // images handled dynamically
            })
          }
        }
      },
    },
    responses: {
      "200": {
        description: "Returns the updated journal entry",
        content: {
          "application/json": {
            schema: z.object({
              success: z.boolean(),
              journal: z.any(),
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
      const idRaw = formData.get('id');
      const id = idRaw && Number(idRaw) > 0 ? Number(idRaw) : null;
      if (!id) {
        return c.json({ success: false, error: 'Journal id must be provided.' }, 400);
      }
      const type = formData.get('type') || null;
      const title = formData.get('title') || null;
      const colorCode = formData.get('colorCode') || null;
      const dateTimeRaw = formData.get('dateTime');
       const dateTime = new Date(dateTimeRaw).toISOString();
      const latRaw = formData.get('lat');
      const longRaw = formData.get('long');
      const lat = latRaw ? parseFloat(latRaw) : null;
      const long = longRaw ? parseFloat(longRaw) : null;
      const description = formData.get('description') || null;
      const location = formData.get('location') || null;
      let img = formData.get('images') || [];
      img = img == '[]' ? []:img;
      // console.log(img,"img");

      let imagesArray = undefined;
      if(typeof img == 'string'){
        imagesArray = cleanImagePath(img);
      }else{
        imagesArray = [];
      }
      console.log(imagesArray,"Asd");
      // Handle multiple images
      const imagePaths: string[] = [];
      for (const entry of formData.entries()) {
        const [key, value] = entry;
        if (key.startsWith('image') && typeof value === 'object' && value.name) {
          const ext = value.name.split('.').pop();
          const filename = `${id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
          const savePath = require('path').join('public/profile-images', filename);
          const arrayBuffer = await value.arrayBuffer();
          require('fs').writeFileSync(savePath, Buffer.from(arrayBuffer));
          imagePaths.push(`/profile-images/${filename}`);
        }
      }
      // console.log(imagePaths,"imagePaths");
      
      // Only update images if new ones are uploaded
      let images = undefined;
      if (imagePaths.length) {
        imagesArray.push(...imagePaths);
        images = JSON.stringify(imagesArray);
      }else{
        images = JSON.stringify(imagesArray)
      }
      console.log(images,"Final images");
      
      // Build updateFields
      const updateFields: Record<string, any> = {};
      if (type !== null) updateFields.type = type;
      if (title !== null) updateFields.title = title;
      if (colorCode !== null) updateFields.colorCode = colorCode;
      if (dateTime !== null) updateFields.dateTime = new Date(dateTime);
      if (lat !== null) updateFields.lat = lat;
      if (long !== null) updateFields.long = long;
      if (description !== null) updateFields.description = description;
      if (location !== null) updateFields.location = location;
      if (images !== undefined) updateFields.images = images;
      // return

      const journal = await db.update(journalTable).set(updateFields).where(eq(journalTable.id, id)).returning();
      return c.json({ success: true, journal: journal[0] });
    } catch (err) {
      return c.json({ success: false, error: err instanceof Error ? err.message : String(err) }, 500);
    }
  }
}
