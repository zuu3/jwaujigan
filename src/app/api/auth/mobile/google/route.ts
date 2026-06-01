import { NextResponse } from "next/server";
import { createMobileToken } from "@/lib/mobile-auth";
import { syncUserRecord } from "@/lib/users";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  error_description?: string;
};

async function getGoogleProfile(body: { idToken?: string; accessToken?: string } | null): Promise<{ tokenInfo: GoogleTokenInfo | null; strictAudienceChecked: boolean }> {
  if (body?.idToken) {
    const tokenInfoRes = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(body.idToken), { cache: "no-store" });
    if (!tokenInfoRes.ok) return { tokenInfo: null, strictAudienceChecked: true };
    return { tokenInfo: await tokenInfoRes.json() as GoogleTokenInfo, strictAudienceChecked: true };
  }

  if (body?.accessToken) {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: "Bearer " + body.accessToken },
      cache: "no-store",
    });
    if (!userInfoRes.ok) return { tokenInfo: null, strictAudienceChecked: false };
    return { tokenInfo: await userInfoRes.json() as GoogleTokenInfo, strictAudienceChecked: false };
  }

  return { tokenInfo: null, strictAudienceChecked: false };
}

function getAllowedClientIds() {
  return [
    process.env.AUTH_GOOGLE_ID,
    ...(process.env.MOBILE_GOOGLE_CLIENT_IDS ?? "").split(","),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { idToken?: string; accessToken?: string } | null;
  const { tokenInfo, strictAudienceChecked } = await getGoogleProfile(body);

  if (!tokenInfo) {
    return NextResponse.json({ message: "Valid Google token is required" }, { status: 401 });
  }

  const allowedClientIds = getAllowedClientIds();
  if (strictAudienceChecked && allowedClientIds.length > 0 && (!tokenInfo.aud || !allowedClientIds.includes(tokenInfo.aud))) {
    return NextResponse.json({ message: "Google client is not allowed" }, { status: 401 });
  }

  if (!tokenInfo.email || tokenInfo.email_verified === false || tokenInfo.email_verified === "false") {
    return NextResponse.json({ message: "Verified email is required" }, { status: 401 });
  }

  const synced = await syncUserRecord({
    email: tokenInfo.email,
    name: tokenInfo.name ?? null,
    image: tokenInfo.picture ?? null,
  });

  if (!synced.ok || !synced.data) {
    return NextResponse.json({ message: "Failed to sync user" }, { status: 500 });
  }

  const token = createMobileToken({
    id: synced.data.id,
    email: synced.data.email,
    name: tokenInfo.name ?? null,
    image: tokenInfo.picture ?? null,
  });

  return NextResponse.json({
    token,
    user: {
      id: synced.data.id,
      email: synced.data.email,
      name: tokenInfo.name ?? null,
      image: tokenInfo.picture ?? null,
      district: synced.data.district ?? null,
    },
  });
}
