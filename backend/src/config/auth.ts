import Google from "@auth/express/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { ExpressAuthConfig } from "@auth/express";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export const authConfig: ExpressAuthConfig = {
  // Bind Auth.js to the database via Prisma Adapter
  adapter: PrismaAdapter(prisma as any),
  
  // Base path of the authentication API endpoints
  basePath: "/api/auth",
  
  // Trust the host header (required for custom environments / reverse proxy setups)
  trustHost: env.AUTH_TRUST_HOST === "true",

  // Define authentication providers
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],

  // Secure session handling using JSON Web Tokens (JWT)
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks to enrich the JWT token and user session details
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

  // Encryption secret for JWT tokens and session data
  secret: env.AUTH_SECRET,
};
