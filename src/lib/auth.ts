import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

function getAllowedEmails(): Set<string> {
  const raw = process.env.ALLOWED_EMAILS || "";
  return new Set(
    raw
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    signIn({ user }) {
      const allowed = getAllowedEmails();
      console.log("[auth] sign-in attempt:", user.email, "| allowed:", [...allowed]);
      if (allowed.size === 0) return true; // no whitelist = allow all
      return allowed.has(user.email?.toLowerCase() || "");
    },
    session({ session, token }) {
      if (token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
});
