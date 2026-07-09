import { Auth } from "@auth/core";
import { authConfig } from "./auth.config";

/**
 * Core Auth.js request handler using @auth/core.
 *
 * This function accepts a standard Web API Request (supporting OAuth flow, JWT session retrieval,
 * sign in, sign out, and callback endpoints) and returns a Web API Response. It is runtime-agnostic
 * and can be integrated into Express, serverless functions, or dev servers.
 */
export async function handleAuthRequest(request: Request): Promise<Response> {
  return await Auth(request, authConfig);
}
