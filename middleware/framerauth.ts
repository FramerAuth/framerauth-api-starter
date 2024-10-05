import { Context } from "hono";
import { verify } from "hono/jwt";
import { createMiddleware } from "hono/factory";
import { decodeBase64 } from "jsr:@std/encoding";
import { HTTPException } from "jsr:@hono/hono/http-exception";

const siteUrl = Deno.env.get("FRAMER_SITE_URL");
const publicKeyBase64 = Deno.env.get("FRAMERAUTH_PUBLIC_KEY");

if (!publicKeyBase64) {
  throw new Error("FRAMERAUTH_PUBLIC_KEY is not set");
}

const publicKeyUint8Array = decodeBase64(publicKeyBase64);
const publicKeyString = new TextDecoder().decode(publicKeyUint8Array);

export const framerAuthMiddleware = createMiddleware(async (ctx, next) => {
  // Get the authorization header
  const credentials = ctx.req.raw.headers.get("Authorization");
  let token;

  // Check if the authorization header is present
  if (credentials) {
    const parts = credentials.split(/\s+/);
    if (parts.length !== 2) {
      const errDescription = "invalid credentials structure";
      throw new HTTPException(401, {
        message: errDescription,
        res: unauthorizedResponse({
          ctx,
          error: "invalid_request",
          errDescription,
        }),
      });
    } else {
      token = parts[1];
    }
  }

  // Check if the token is present
  if (!token) {
    const errDescription = "no authorization included in request";
    throw new HTTPException(401, {
      message: errDescription,
      res: unauthorizedResponse({
        ctx,
        error: "invalid_request",
        errDescription,
      }),
    });
  }

  // Verify the token
  let payload;
  let cause;
  try {
    payload = await verify(token, publicKeyString, "RS256");
  } catch (e) {
    cause = e;
  }
  if (!payload) {
    throw new HTTPException(401, {
      message: "Unauthorized",
      res: unauthorizedResponse({
        ctx,
        error: "invalid_token",
        statusText: "Unauthorized",
        errDescription: "token verification failure",
      }),
      cause,
    });
  }

  // Ensure the token is for the correct site
  if (payload.aud !== siteUrl) {
    throw new HTTPException(401, {
      message: "Unauthorized",
      res: unauthorizedResponse({
        ctx,
        error: "invalid_token",
        statusText: "Unauthorized",
        errDescription: "token verification failure",
      }),
    });
  }

  // Set the payload in the context
  ctx.set("jwtPayload", payload);

  // Continue to the next middleware
  return await next();
});

function unauthorizedResponse(opts: {
  ctx: Context;
  error: string;
  errDescription: string;
  statusText?: string;
}) {
  return new Response("Unauthorized", {
    status: 401,
    statusText: opts.statusText,
    headers: {
      "WWW-Authenticate": `Bearer realm="${opts.ctx.req.url}",error="${opts.error}",error_description="${opts.errDescription}"`,
    },
  });
}
