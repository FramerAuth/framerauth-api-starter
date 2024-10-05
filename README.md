# FramerAuth API Starter (Deno + Hono)

This repository provides a starter template for building a secure API using Deno, HonoJS and FramerAuth.

## Key Features

- Built on Deno, the secure runtime for JavaScript and TypeScript
- Uses Hono, a lightweight and fast web framework for Deno
- Integrates FramerAuth for secure authentication
- Compatible with Supabase, which uses Deno under the hood

This starter is ideal for projects that require a secure, scalable API, especially if you're considering using Supabase as your backend. Since Supabase uses Deno internally, this starter aligns well with that ecosystem, allowing for seamless integration and deployment.

## Getting Started

### Prerequisites

- Deno installed on your system
- A Framer account with a site URL
- A FramerAuth account
- A FramerAuth public key

### Environment Variables

Before running the application, make sure to set the following required environment variables:

- `FRAMER_SITE_URL`: Your Framer site URL
- `FRAMERAUTH_PUBLIC_KEY`: Your FramerAuth public key (base64 encoded)

You can set these variables in a `.env` file in the root of your project.

### Running the Application

To run the application in development mode with hot reloading.

```bash
deno task dev
```

To start the application in production mode:

```bash
deno task start
```

## Securing Routes with FramerAuth Middleware

You can secure your API routes using the FramerAuth middleware. Here are two approaches:

### 1. Applying Middleware Globally

To secure all routes in your application, you can apply the middleware globally:

```typescript
import { Hono } from "hono";
import { framerAuthMiddleware } from "./middleware/framerauth.ts";

const app = new Hono();

// Apply the middleware globally
app.use("*", framerAuthMiddleware);

// Your routes go here
app.get("/", (c) => c.text("Hello, secured world!"));

export default app;
```

### 2. Securing Specific Routes

To secure only specific routes, you can apply the middleware to individual routes or groups of routes:

```typescript
import { Hono } from "hono";
import { framerAuthMiddleware } from "./middleware/framerauth.ts";

const app = new Hono();

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

export default app;
```

By using these approaches, you can easily control which parts of your API require FramerAuth authentication.

## Example: Making an authenticated request to your API

Here's an example of how to make an authenticated request to your API using the FramerAuth token with async/await syntax:

```javascript
async function fetchProtectedData() {
  try {
    const token = await FramerAuth.getAccessToken();

    const response = await fetch("http://localhost:8000/protected", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    console.log("Protected data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching protected data:", error);
    throw error;
  }
}
```

## Additional Resources

For more information on using middleware with Hono, please refer to the [Hono Middleware Guide](https://hono.dev/docs/guides/middleware).
