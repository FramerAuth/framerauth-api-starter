import { Hono } from "hono";
import "jsr:@std/dotenv/load";
import type { JwtVariables } from "hono/jwt";
import { framerAuthMiddleware } from "./middleware/framerauth.ts";

const app = new Hono<{ Variables: JwtVariables }>();

// Public route
app.get("/", (c) => {
  return c.json({ message: "Hello World" });
});

// Secured route
app.get("/protected", framerAuthMiddleware, (c) => {
  const jwtPayload = c.get("jwtPayload");
  const fullName = `${jwtPayload.first_name} ${jwtPayload.last_name}`;
  return c.json({ message: `Hello ${fullName}` });
});

Deno.serve(app.fetch);
