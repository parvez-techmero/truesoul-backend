

import { usersTable } from '../../db/schema';
import { db } from '../../lib/database';
import { Num, OpenAPIRoute } from 'chanfana';
import { createUserSchema, userSchema } from '../../types';
import { eq, and } from 'drizzle-orm';
import { z } from "zod";
import { uuid } from 'drizzle-orm/gel-core';

// Function to generate unique alphanumeric invite code
function generateInviteCode(length: number = 8): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export class UserCreate extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Create a new User",

        request: {
            // query: z.object({
            //     socialId: z.string().nullable().optional(),
            //     uuid: z.string().nullable().optional(),
            // }),
            body: {
                content: {
                    "application/json": {
                        schema: createUserSchema,
                    },
                },
            },
        },
        responses: {
            "200": {
                description: "Returns the created User",
                content: {
                    "application/json": {
                        schema: z.object({
                            success: z.boolean(),
                            data: userSchema
                        }),
                    },
                },
            },
        },
    };

    async handle(c) {
        const { body, query } = await this.getValidatedData<typeof this.schema>();
        // Map string IDs to integers if present
        // Ensure required fields are present and mapped

        try {
            // Check for existing social ID only among non-deleted users
            const [social] = await db.select().from(usersTable).where(
                and(
                    eq(usersTable.socialId, body.socialId),
                    eq(usersTable.deleted, false)
                )
            );

            if (social) {
                return c.json({ success: false,  error: "User with this social ID already exists", data: social }, 409);
            } else {
                // Check for existing UUID only among non-deleted users
                const [uuid] = await db.select().from(usersTable).where(
                    and(
                        eq(usersTable.uuid, body.uuid),
                        eq(usersTable.deleted, false)
                    )
                );

                if (uuid) {
                    return c.json({ success: false, error: "User with this UUID already exists", data: uuid }, 409);
                }
            }

            // Generate unique invite code
            let inviteCode: string;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            do {
                inviteCode = generateInviteCode(8);
                const [existingCode] = await db.select().from(usersTable).where(
                    and(
                        eq(usersTable.inviteCode, inviteCode),
                        eq(usersTable.deleted, false)
                    )
                );
                isUnique = !existingCode;
                attempts++;
            } while (!isUnique && attempts < maxAttempts);

            if (!isUnique) {
                return c.json({ success: false, error: "Unable to generate unique invite code" }, 500);
            }

            const userData = {
                uuid: body.uuid,
                // transactionId: body.transactionId,
                socialId: body.socialId,
                inviteCode: inviteCode,
                deleted: false, // Explicitly set deleted to false for new users
                // name: body.name,
                // gender: body.gender,
                // birthDate: body.birthDate ? (body.birthDate instanceof Date ? body.birthDate.toISOString().slice(0, 10) : undefined) : undefined,
                // lat: body.lat !== undefined ? String(body.lat) : undefined,
                // long: body.long !== undefined ? String(body.long) : undefined,
                // anniversary: body.anniversary ? (body.anniversary instanceof Date ? body.anniversary.toISOString().slice(0, 10) : undefined) : undefined,
                // relationshipStatus: body.relationshipStatus,
                // expectations: body.expectations,
                // lang: body.lang,
                // distanceUnit: body.distanceUnit,
                // hideContent: body.hideContent,
                // locationPermission: body.locationPermission,
                // mood: body.mood,
                // isActive: true,
                // lastActiveAt: null,
                // createdAt: new Date(),
                // updatedAt: new Date(),
            };
            const [user] = await db.insert(usersTable).values(userData).returning();
            return c.json({ success: true, data: user });
        } catch (error: any) {
            // if (
            //     error &&
            //     typeof error === 'object' &&
            //     'code' in error &&
            //     error.code === '23505'
            // ) {
            //     return c.json({ error: "User with this invite code already exists" }, 409);
            // }
            return c.json({ error: error.cause || 'Internal server error' }, 500);
        }
    }
}

