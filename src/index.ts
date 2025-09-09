import { fromHono } from "chanfana";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { setUpOpenAPI } from "./openapi";
import 'dotenv/config'
import { dbMiddleware } from "./middleware/dbMiddleware";


// Start a Hono app (remove Cloudflare Workers Env binding)
const app = new Hono();

app.use('*', dbMiddleware);
setUpOpenAPI(app);

// You may also register routes for non OpenAPI directly on Hono
// app.get('/test', (c) => c.text('Hono!'))

// Start the Node.js server
const port = Number(process.env.PORT) || 3000;

console.log(`🚀 Server starting on http://localhost:${port}`);
console.log(`📖 API Documentation available at http://localhost:${port}/`);

serve({
	fetch: app.fetch,
	port,
});

// Export the Hono app
export default app;
