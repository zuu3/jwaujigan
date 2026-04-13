import rawDistricts from "./data.json";

export type DistrictEntry = {
  province: string | null;
  district: string;
  areas: string[];
};

export type DistrictAreaOption = {
  id: string;
  province: string | null;
  district: string;
  districtLabel: string;
  area: string;
  areaLabel: string;
  searchText: string;
};

export const DISTRICTS = rawDistricts as DistrictEntry[];

export function normalizeKoreanText(value: string) {
  return value
    .trim()
    .replace(/\s+/g, "")
    .replace(/[·ㆍ․]/g, "")
    .replace(/[()]/g, "")
    .replace(/제(?=\d)/g, "")
    .replace(/특별자치도/g, "도")
    .replace(/특별자치시/g, "시")
    .replace(/특별시/g, "시")
    .replace(/광역시/g, "시");
}

function dedupe(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function formatDistrictLabel(district: string) {
  return district.replace(/선거구$/, "");
}

function formatAreaLabel(area: string) {
  if (area.endsWith("일원")) {
    return `${area.slice(0, -2)} 전체`;
  }

  return area.replace(/제(?=\d)/g, "");
}

export const DISTRICT_PROVINCES = DISTRICTS.map((entry) => entry.province).filter(
  (province, index, values): province is string =>
    Boolean(province) && values.indexOf(province) === index,
);

export const DISTRICT_AREA_OPTIONS: DistrictAreaOption[] = DISTRICTS.flatMap((entry) =>
  dedupe(entry.areas).map((area) => {
    const districtLabel = formatDistrictLabel(entry.district);
    const areaLabel = formatAreaLabel(area);

    return {
      id: `${entry.province ?? "unknown"}:${entry.district}:${area}`,
      province: entry.province,
      district: entry.district,
      districtLabel,
      area,
      areaLabel,
      searchText: normalizeKoreanText(
        [entry.province ?? "", districtLabel, entry.district, areaLabel, area]
          .filter(Boolean)
          .join(" "),
      ),
    };
  }),
);
