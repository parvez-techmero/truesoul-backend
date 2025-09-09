

import { usersTable } from '../../db/schema';
import { db } from '../../lib/database';
import { OpenAPIRoute } from 'chanfana';
import { createUserSchema, userSchema } from '../../types';

export class UserCreate extends OpenAPIRoute {
    schema = {
        tags: ["User"],
        summary: "Create a new User",
        request: {
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
                        schema: userSchema,
                    },
                },
            },
        },
    };

    async handle(c) {
        const { body } = await this.getValidatedData<typeof this.schema>();
        // Map string IDs to integers if present
            // Ensure required fields are present and mapped
                    const userData = {
                        uuid: body.uuid,
                        transactionId: body.transactionId,
                        socialId: body.socialId,
                        name: body.name,
                        gender: body.gender,
                        birthDate: body.birthDate ? (body.birthDate instanceof Date ? body.birthDate.toISOString().slice(0, 10) : undefined) : undefined,
                        lat: body.lat !== undefined ? String(body.lat) : undefined,
                        long: body.long !== undefined ? String(body.long) : undefined,
                        anniversary: body.anniversary ? (body.anniversary instanceof Date ? body.anniversary.toISOString().slice(0, 10) : undefined) : undefined,
                        relationshipStatus: body.relationshipStatus,
                        expectations: body.expectations,
                        inviteCode: body.inviteCode,
                        lang: body.lang,
                        distanceUnit: body.distanceUnit,
                        hideContent: body.hideContent,
                        locationPermission: body.locationPermission,
                        mood: body.mood,
                        isActive: true,
                        lastActiveAt: null,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
        try {
            const user = await db.insert(usersTable).values(userData).returning();
            return c.json({ success: true, user: user[0] });
        } catch (error: unknown) {
            if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === '23505'
            ) {
                return c.json({ error: "User with this invite code already exists" }, 409);
            }
            return c.json({ error: "Internal server error" }, 500);
        }
    }
}

