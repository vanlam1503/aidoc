import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/database/prisma";
import { isGoogleOAuthConfigured } from "@/features/authentication/config";

const googleConfigured = isGoogleOAuthConfigured();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: googleConfigured ? [Google] : [],
  secret: process.env.AUTH_SECRET ?? (process.env.NODE_ENV === "development" ? "local-development-only-change-before-deploying" : undefined),
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/auth/signin" },
  trustHost: true,
  useSecureCookies: process.env.NODE_ENV === "production",
});
