export const PARTY_LOGOS: Record<string, string> = {
  국민의힘: "/assets/parties/ppp.png",
  더불어민주당: "/assets/parties/dpp.png",
  조국혁신당: "/assets/parties/rpp.png",
  개혁신당: "/assets/parties/rp.png",
};

export function getPartyPresentation(party: string) {
  const label = party.split("/")[0]?.trim() ?? party.trim();

  return {
    label,
    src: PARTY_LOGOS[label] ?? null,
  };
}
