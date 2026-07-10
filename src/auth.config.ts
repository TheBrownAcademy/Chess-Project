import Google from "@auth/core/providers/google";
import type { AuthConfig } from "@auth/core";

// Declare process type globally for TypeScript compatibility in the client build context
declare const process: {
  env: {
    NODE_ENV?: string;
    AUTH_SECRET?: string;
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
    [key: string]: string | undefined;
  };
};


// Determine if we should use secure, HTTPS-only cookies.
// Since local development runs on http://localhost:5173, cookies are standard,
// but in production, we require __Secure- prefixes and the secure flag.
const useSecureCookies = process.env.NODE_ENV === "production";

/**
 * Authentication Configuration for Auth.js (@auth/core).
 *
 * This configuration defines authentication providers, session strategies,
 * secure cookie policies, and session lifecycle callbacks. It is designed to
 * be fully compatible with both the client-side session management and the
 * backend middleware/API route handlers.
 */
export const authConfig: AuthConfig = {
  // Base path of the authentication API endpoints
  basePath: "/api/auth",

  // Trust the host header for redirection and callbacks (required by @auth/core in custom environments)
  trustHost: true,

  // Define authentication providers.
  // Additional providers (e.g. GitHub, Discord, Apple) can be easily added to this list.
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],

  // Configure secure session handling using JSON Web Tokens (JWT).
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Secure cookie configuration conforming to production best practices.
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-auth.session-token" : "auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },

  // Callbacks to enrich the JWT token and user session details.
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },

  // Encryption secret for JWT tokens and session data.
  secret: process.env.AUTH_SECRET,
};
