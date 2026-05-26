import { NextRequest, NextResponse } from "next/server";
import { get as httpsGet } from "node:https";

export type ElectionPledge = {
  realm: string;
  title: string;
  content: string;
};

const PLEDGE_API = "https://apis.data.go.kr/9760000/ElecPrmsInfoInqireService/getCnddtElecPrmsInfoInqire";
const PLEDGE_SG_ID = "20260603";
const PLEDGE_TYPES = new Set([3, 4, 11]);

function fetchRaw(url: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const req = httpsGet(url, { rejectUnauthorized: false }, (res) => {
      const chunks: Buffer[] = [];
      res.on("data", (c: Buffer) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.setTimeout(15_000, () => req.destroy(new Error("timed out")));
  });
}

function parseXmlItem(xml: string): Record<string, string> {
  const item: Record<string, string> = {};
  const fieldRe = /<([^/>]+)>([^<]*)<\/\1>/g;
  let m: RegExpExecArray | null;
  while ((m = fieldRe.exec(xml)) !== null) {
    item[m[1]] = m[2].trim();
  }
  return item;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const huboid = searchParams.get("huboid");
  const sgTypecodeRaw = searchParams.get("sgTypecode");

  if (!huboid || !sgTypecodeRaw) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const sgTypecode = parseInt(sgTypecodeRaw, 10);

  if (!PLEDGE_TYPES.has(sgTypecode)) {
    return NextResponse.json({ pledges: [] });
  }

  const key = encodeURIComponent(process.env.LOCAL_ELECTION_API_KEY ?? "");
  const url = `${PLEDGE_API}?serviceKey=${key}&cnddtId=${huboid}&sgId=${PLEDGE_SG_ID}&sgTypecode=${sgTypecode}&numOfRows=1&pageNo=1`;

  try {
    const xml = await fetchRaw(url);

    if (!xml.includes("<resultCode>INFO-00</resultCode>")) {
      return NextResponse.json({ pledges: [] });
    }

    const itemMatch = xml.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) return NextResponse.json({ pledges: [] });

    const item = parseXmlItem(itemMatch[1]);
    const prmsCnt = parseInt(item.prmsCnt ?? "0", 10);

    const pledges: ElectionPledge[] = [];
    for (let i = 1; i <= Math.min(prmsCnt, 10); i++) {
      const realm = item[`prmsRealmName${i}`] ?? "";
      const title = item[`prmsTitle${i}`] ?? "";
      const content = item[`prmmCont${i}`] ?? "";
      if (title || content) {
        pledges.push({ realm, title, content });
      }
    }

    return NextResponse.json({ pledges });
  } catch (err) {
    console.error("election-pledge API error:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
