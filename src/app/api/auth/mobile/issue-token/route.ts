import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createMobileToken } from "@/lib/mobile-auth";
import { syncUserRecord } from "@/lib/users";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.redirect("https://jwj.zuu3.kr/mobile-login?error=unauthenticated");
  }

  const synced = await syncUserRecord({
    email: session.user.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  });

  if (!synced.ok || !synced.data) {
    return NextResponse.redirect("https://jwj.zuu3.kr/mobile-login?error=sync_failed");
  }

  const token = createMobileToken({
    id: synced.data.id,
    email: synced.data.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
  });

  const userJson = encodeURIComponent(JSON.stringify({
    id: synced.data.id,
    email: synced.data.email,
    name: session.user.name ?? null,
    image: session.user.image ?? null,
    district: synced.data.district ?? null,
    area: synced.data.area ?? null,
  }));

  return NextResponse.redirect(
    `jwaujigan://auth?token=${encodeURIComponent(token)}&user=${userJson}`
  );
}
