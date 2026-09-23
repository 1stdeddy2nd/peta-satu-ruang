import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Auth.js only trusts the request host automatically on Vercel; anywhere else
  // every request fails with UntrustedHost until this is set.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim().toLowerCase();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        // Compare even when the user is missing, so a wrong email and a wrong
        // password take the same time and cannot be told apart.
        const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
        const ok = await bcrypt.compare(password, hash);
        if (!user || !ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role ?? "admin";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.uid ?? "");
        session.user.role = String(token.role ?? "admin");
      }
      return session;
    },
  },
});
