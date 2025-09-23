import { Bool, Num, OpenAPIRoute } from "chanfana";
import { z } from "zod";
import { usersTable } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { validateImageFile, generateUniqueFilename, getFileExtensionFromMimeType } from '../../utils/imageHelper';

export class UserProfileImageUpdate extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Update user profile image",
        request: {
            body: {
                content: {
                    "multipart/form-data": {
                        schema: z.object({
                            image: z
                                .any()
                                .openapi({
                                    type: "string",
                                    format: "binary",
                                    description: "Image file (.jpg, .jpeg, .png, .webp) for user profile picture",
                                }),
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
                description: "Profile image updated successfully",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            message: z.string(),
                            profileImg: z.string(),
                        }),
                    },
                },
            },
            "400": {
                description: "Bad request - invalid file or data",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            error: z.string(),
                        }),
                    },
                },
            },
            "404": {
                description: "User not found",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: Bool(),
                            error: z.string(),
                        }),
                    },
                },
            },
        },
    };

    async handle(c) {
        const { params } = await this.getValidatedData<typeof this.schema>();
        const db = c.get('db');
        
        try {
            // Check if user exists and is not deleted
            const [existingUser] = await db.select().from(usersTable).where(
                and(
                    eq(usersTable.id, params.id),
                    eq(usersTable.deleted, false)
                )
            );
            if (!existingUser) {
                return c.json({ success: false, error: "User not found" }, 404);
            }

            // Parse the multipart form data
            const body = await c.req.parseBody();
            const imageFile = body['image'] as File;

            if (!imageFile) {
                return c.json({ success: false, error: "Please upload an image file" }, 400);
            }

            // Validate image file
            const validation = validateImageFile(imageFile);
            if (!validation.isValid) {
                return c.json({ 
                    success: false, 
                    error: validation.error 
                }, 400);
            }

            // Generate unique filename
            const fileExtension = getFileExtensionFromMimeType(imageFile.type);
            const uniqueFilename = generateUniqueFilename(params.id, fileExtension);
            
            // Create upload directory if it doesn't exist
            const uploadDir = path.join(process.cwd(), 'public', 'profile-images');
            if (!existsSync(uploadDir)) {
                await mkdir(uploadDir, { recursive: true });
            }

            // Convert File to Buffer and save
            const arrayBuffer = await imageFile.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const filePath = path.join(uploadDir, uniqueFilename);
            
            await writeFile(filePath, buffer);

            // Update user's profileImg in database
            const profileImgUrl = `/profile-images/${uniqueFilename}`;
            const [updatedUser] = await db
                .update(usersTable)
                .set({ 
                    profileImg: profileImgUrl,
                    updatedAt: new Date()
                })
                .where(
                    and(
                        eq(usersTable.id, params.id),
                        eq(usersTable.deleted, false)
                    )
                )
                .returning();

            return c.json({
                success: true,
                message: "Profile image updated successfully",
                profileImg: profileImgUrl
            });

        } catch (error) {
            console.error("Profile image upload error:", error);
            return c.json({ 
                success: false, 
                error: "Failed to upload profile image" 
            }, 500);
        }
    }
}
