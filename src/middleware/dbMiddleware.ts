import { db } from '../lib/database';
import { MiddlewareHandler } from 'hono';
import type { Context } from "hono";

// export function dbMiddleware() {
//   return async (c, next) => {
//     c.set('db', db);
//     await next();
//   };
// }


export type Env = {
    Bindings: {
        DATABASE_URL: string
        JWT_SECRET: string
    }
    Variables: {
        authenticatedId: number
    }
};

export type AppContext = Context<Env>;


export const dbMiddleware: MiddlewareHandler = async (c, next) => {
    // const prisma = new PrismaClient()
    const dbURL = process.env.DATABASE_URL;
    if (!dbURL) {
        console.error("DATABASE_URL is not set in the environment.");
        return c.json({ error: "Server misconfiguration" }, 500);
    }

    // .$extends(withAccelerate())
    c.set('db', db)
    await next()
}
