import { auth } from "./auth";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const session = await auth();
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    redirect("/home");
  }

  return session;
}

export function isAdminEmail(email: string | null | undefined) {
  const adminEmail = process.env.ADMIN_EMAIL;
  return Boolean(adminEmail && email && email === adminEmail);
}

export async function requireAdminApi() {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return { error: NextResponse.json({ message: "Unauthorized" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}
