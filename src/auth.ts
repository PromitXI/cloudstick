import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On first sign-in, persist the stable Google account ID.
      // account & profile are only available on the initial sign-in call.
      if (account && profile) {
        // providerAccountId is the Google-issued unique ID — stable across logins
        token.stableUserId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // Use the stable Google ID so Azure storage prefix never changes
        session.user.id = (token.stableUserId as string) || token.sub!;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
