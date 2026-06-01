import { auth } from "@/lib/auth";
import { getMobileUserFromRequest } from "@/lib/mobile-auth";
import { getUserGateState } from "@/lib/users";

export type RequestUser = {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  district?: string | null;
  hasPoliticalProfile?: boolean;
};

export type RequestSession = {
  user: RequestUser;
  source: "web" | "mobile";
};

export async function requestAuth(request?: Request): Promise<RequestSession | null> {
  const webSession = await auth();
  if (webSession?.user?.email && webSession.user.id) {
    return {
      user: {
        id: webSession.user.id,
        email: webSession.user.email,
        name: webSession.user.name ?? null,
        image: webSession.user.image ?? null,
        district: webSession.user.district ?? null,
        hasPoliticalProfile: webSession.user.hasPoliticalProfile,
      },
      source: "web",
    };
  }

  if (!request) return null;

  const mobileUser = await getMobileUserFromRequest(request);
  if (!mobileUser) return null;

  const gateState = await getUserGateState(mobileUser.email);
  return {
    user: {
      id: mobileUser.id,
      email: mobileUser.email,
      name: mobileUser.name,
      image: mobileUser.image,
      district: gateState.district,
      hasPoliticalProfile: gateState.hasPoliticalProfile,
    },
    source: "mobile",
  };
}
