import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserGateState, syncUserRecord } from "./src/lib/users";

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) {
        return false;
      }

      const synced = await syncUserRecord({
        email: user.email,
        name: user.name ?? null,
        image: user.image ?? null,
      });

      return synced.ok;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;

      if (!email) {
        return token;
      }

      const state = await getUserGateState(email);

      token.email = email;
      token.userId = state.userId;
      token.district = state.district;
      token.hasPoliticalProfile = state.hasPoliticalProfile;

      if (user?.name) {
        token.name = user.name;
      }

      if (user?.image) {
        token.picture = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id =
        typeof token.userId === "string" ? token.userId : token.sub ?? "";
      session.user.district =
        typeof token.district === "string" ? token.district : null;
      session.user.hasPoliticalProfile = Boolean(token.hasPoliticalProfile);

      if (typeof token.email === "string") {
        session.user.email = token.email;
      }

      if (typeof token.picture === "string") {
        session.user.image = token.picture;
      }

      return session;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
