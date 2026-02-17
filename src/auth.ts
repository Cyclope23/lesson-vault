import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compareSync } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;
        if (user.status !== "ACTIVE") return null;

        const isValid = compareSync(
          credentials.password as string,
          user.passwordHash
        );
        if (!isValid) return null;

        // Check if Gemini is configured system-wide
        const geminiConfig = await prisma.systemConfig.findUnique({
          where: { key: "gemini_api_key" },
        });

        return {
          id: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          disciplineId: user.disciplineId,
          apiKeyConfigured: user.apiKeyConfigured,
          geminiAvailable: geminiConfig !== null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.disciplineId = (user as any).disciplineId;
        token.apiKeyConfigured = (user as any).apiKeyConfigured;
        token.geminiAvailable = (user as any).geminiAvailable;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).disciplineId = token.disciplineId;
        (session.user as any).apiKeyConfigured = token.apiKeyConfigured;
        (session.user as any).geminiAvailable = token.geminiAvailable;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
