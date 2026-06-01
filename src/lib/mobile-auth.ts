import { createHmac, timingSafeEqual } from "crypto";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30;

type MobileTokenPayload = {
  sub: string;
  email: string;
  name: string | null;
  image: string | null;
  exp: number;
};

export type MobileUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

function getSecret() {
  const secret = process.env.MOBILE_AUTH_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) throw new Error("Missing MOBILE_AUTH_SECRET or AUTH_SECRET");
  return secret;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64url");
}

function signPart(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

export function createMobileToken(user: MobileUser) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  } satisfies MobileTokenPayload));
  const signingInput = header + "." + payload;
  return signingInput + "." + signPart(signingInput);
}

export function verifyMobileToken(token: string): MobileTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = signPart(header + "." + payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as MobileTokenPayload;
  if (!parsed.sub || !parsed.email || parsed.exp < Math.floor(Date.now() / 1000)) return null;
  return parsed;
}

export async function getMobileUserFromRequest(request: Request): Promise<MobileUser | null> {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
  if (!token) return null;

  const payload = verifyMobileToken(token);
  if (!payload) return null;

  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("users")
    .select("id, email, name, image")
    .eq("id", payload.sub)
    .maybeSingle();

  return data ?? null;
}
