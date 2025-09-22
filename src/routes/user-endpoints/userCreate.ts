

import { usersTable } from '../../db/schema';
import { db } from '../../lib/database';
import { Num, OpenAPIRoute } from 'chanfana';
import { createUserSchema, userSchema } from '../../types';
import { eq } from 'drizzle-orm';
import { z } from "zod";
import { uuid } from 'drizzle-orm/gel-core';

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
            const [social] = await db.select().from(usersTable).where(eq(usersTable.socialId, body.socialId));

            if (social) {
                return c.json({ success: false,  error: "User with this social ID already exists", data: social }, 409);
            } else {
                const [uuid] = await db.select().from(usersTable).where(eq(usersTable.uuid, body.uuid));

                if (uuid) {
                    return c.json({ success: false, error: "User with this UUID already exists", data: uuid }, 409);
                }
            }
            const userData = {
                uuid: body.uuid,
                // transactionId: body.transactionId,
                socialId: body.socialId,
                // name: body.name,
                // gender: body.gender,
                // birthDate: body.birthDate ? (body.birthDate instanceof Date ? body.birthDate.toISOString().slice(0, 10) : undefined) : undefined,
                // lat: body.lat !== undefined ? String(body.lat) : undefined,
                // long: body.long !== undefined ? String(body.long) : undefined,
                // anniversary: body.anniversary ? (body.anniversary instanceof Date ? body.anniversary.toISOString().slice(0, 10) : undefined) : undefined,
                // relationshipStatus: body.relationshipStatus,
                // expectations: body.expectations,
                // inviteCode: body.inviteCode,
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

