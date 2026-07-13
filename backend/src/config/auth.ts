import Google from "@auth/express/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { ExpressAuthConfig } from "@auth/express";
import { prisma } from "./prisma.js";
import { env } from "./env.js";

export const authConfig: ExpressAuthConfig = {
  // Bind Auth.js to the database via Prisma Adapter
  adapter: PrismaAdapter(prisma as any),
  
  // Trust the host header (required for custom environments / reverse proxy setups)
  trustHost: env.AUTH_TRUST_HOST === "true",

  // Define authentication providers
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],

  // Secure session handling using Database Sessions
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks to enrich session details
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && account) {
        token.id = user.id;
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, user, token }) {
      if (user && session.user) {
        session.user.id = user.id;
      } else if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
    async redirect({ url }) {
      const clientOrigin = env.CLIENT_ORIGIN || "http://localhost:5173";
      // If the redirect URL points to localhost:3000 or is relative, rewrite the origin to the client origin.
      if (url.includes("localhost:3000") || url.startsWith("/")) {
        const path = url.replace(/^(https?:\/\/localhost:3000)?/, "");
        return `${clientOrigin}${path.startsWith("/") ? "" : "/"}${path}`;
      }
      return url;
    },
  },

  // Encryption secret for JWT tokens and session data
  secret: env.AUTH_SECRET,
};
