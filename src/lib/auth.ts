import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { getUserGateState, syncUserRecord } from "./users";

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
    async jwt({ token, user, trigger, session }) {
      // 최초 로그인 시에만 DB 조회
      if (user?.email) {
        const state = await getUserGateState(user.email);
        return {
          ...token,
          email: user.email,
          name: user.name ?? token.name,
          picture: user.image ?? token.picture,
          userId: state.userId,
          district: state.district,
          hasPoliticalProfile: state.hasPoliticalProfile,
        };
      }

      // 클라이언트 update() 호출 시 토큰 패치 (DB 조회 없음)
      if (trigger === "update" && session) {
        return { ...token, ...session };
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
