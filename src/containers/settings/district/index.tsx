"use client";

import styled from "@/lib/styled";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useSession } from "next-auth/react";
import {
  DistrictStep,
  getLocationErrorMessage,
  resolveCurrentPosition,
  MANUAL_MATCH_LIMIT,
  getManualResultScore,
} from "@/containers/onboarding/DistrictStep";
import {
  DISTRICT_AREA_OPTIONS,
  normalizeKoreanText,
  type DistrictAreaOption,
} from "@/lib/districts/catalog";

type DistrictRequestPayload = {
  latitude?: number;
  longitude?: number;
  district?: string;
  matchedArea?: string;
  sourceAddress?: string;
};

type DistrictResponse = {
  district: string;
  sourceAddress: string;
  matchedArea?: string;
};

export function SettingsDistrictContainer() {
  const { update: updateSession } = useSession();
  const [district, setDistrict] = useState<string | null>(null);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSavingManualDistrict, setIsSavingManualDistrict] = useState(false);
  const [savingManualOptionId, setSavingManualOptionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [manualQuery, setManualQuery] = useState("");
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [districtNotice, setDistrictNotice] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const normalizedManualQuery = normalizeKoreanText(manualQuery);

  const manualMatches =
    normalizedManualQuery.length >= 1
      ? DISTRICT_AREA_OPTIONS.filter((option) => {
          if (selectedProvince !== "all" && option.province !== selectedProvince) return false;
          const normalizedArea = normalizeKoreanText(option.areaLabel);
          const normalizedDistrict = normalizeKoreanText(option.districtLabel);
          return (
            normalizedArea.includes(normalizedManualQuery) ||
            normalizedDistrict.includes(normalizedManualQuery)
          );
        })
          .sort((a, b) => {
            const scoreA = getManualResultScore(a, normalizedManualQuery);
            const scoreB = getManualResultScore(b, normalizedManualQuery);
            if (scoreB !== scoreA) return scoreB - scoreA;
            return a.areaLabel.localeCompare(b.areaLabel, "ko");
          })
          .slice(0, MANUAL_MATCH_LIMIT)
      : [];

  const saveDistrict = async (payload: DistrictRequestPayload) => {
    const response = await fetch("/api/district", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as DistrictResponse & { message?: string };
    if (!response.ok) throw new Error(result.message ?? "Failed to resolve district.");
    setDistrict(result.district);
    setResolvedAddress(result.sourceAddress);
    void updateSession({ district: result.district, area: result.matchedArea ?? null });
    setDistrictError(null);
    setDistrictNotice(
      payload.district
        ? result.matchedArea
          ? `${result.matchedArea} 기준으로 지역구를 설정했습니다.`
          : "지역구를 설정했습니다."
        : result.matchedArea
          ? `${result.matchedArea} 기준으로 지역구를 찾았습니다.`
          : "지역구를 찾았습니다.",
    );
  };

  const handleResolveLocation = async () => {
    setIsResolvingLocation(true);
    setDistrictError(null);
    setDistrictNotice(null);
    try {
      const position = await resolveCurrentPosition();
      await saveDistrict({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      setManualQuery("");
      setSelectedOptionId(null);
    } catch (error) {
      setDistrictError(getLocationErrorMessage(error));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleManualDistrictSelect = async (option: DistrictAreaOption) => {
    setIsSavingManualDistrict(true);
    setSavingManualOptionId(option.id);
    setDistrictError(null);
    setDistrictNotice(null);
    try {
      await saveDistrict({
        district: option.district,
        matchedArea: option.area,
        sourceAddress: [option.province, option.area].filter(Boolean).join(" "),
      });
      setSelectedOptionId(option.id);
    } catch (error) {
      setDistrictError(
        error instanceof Error ? error.message : "선택한 지역구를 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingManualDistrict(false);
      setSavingManualOptionId(null);
    }
  };

  const handleContinue = () => {
    if (!district) {
      setDistrictError("지역구를 먼저 골라주세요.");
      return;
    }
    setSaved(true);
  };

  if (saved && district) {
    return (
      <Page>
        <Shell>
          <BackLink href="/mypage">
            <ArrowLeft size={18} />
            마이페이지
          </BackLink>
          <SavedCard>
            <SavedTitle>지역구가 설정됐어요</SavedTitle>
            <SavedDistrict>{district}</SavedDistrict>
            <DoneButton href="/mypage">마이페이지로</DoneButton>
          </SavedCard>
        </Shell>
      </Page>
    );
  }

  return (
    <Page>
      <Shell>
        <BackLink href="/mypage">
          <ArrowLeft size={18} />
          마이페이지
        </BackLink>
        <PageTitle>내 지역 설정</PageTitle>
        <DistrictStep
          district={district}
          selectedOptionId={selectedOptionId}
          resolvedAddress={resolvedAddress}
          initialDistrict={null}
          isResolvingLocation={isResolvingLocation}
          isSavingManualDistrict={isSavingManualDistrict}
          savingManualOptionId={savingManualOptionId}
          selectedProvince={selectedProvince}
          manualQuery={manualQuery}
          normalizedManualQuery={normalizedManualQuery}
          manualMatches={manualMatches}
          districtError={districtError}
          districtNotice={districtNotice}
          referralCode=""
          referralAutoFilled={false}
          onReferralCodeChange={() => {}}
          onResolveLocation={handleResolveLocation}
          onManualDistrictSelect={handleManualDistrictSelect}
          onProvinceChange={setSelectedProvince}
          onManualQueryChange={setManualQuery}
          onContinueToQuestions={handleContinue}
        />
      </Shell>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100dvh;
  background: #ffffff;
`;

const Shell = styled.div`
  max-width: 480px;
  margin: 0 auto;
  padding: 0 20px 40px;
`;

const BackLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 16px 0;
  color: #6b7684;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
`;

const PageTitle = styled.h1`
  font-size: 22px;
  font-weight: 700;
  color: #191f28;
  margin: 0 0 24px;
`;

const SavedCard = styled.div`
  display: grid;
  gap: 12px;
  padding: 32px 20px;
  background: #f9fafb;
  border-radius: 12px;
  text-align: center;
  margin-top: 24px;
`;

const SavedTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #191f28;
`;

const SavedDistrict = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #3182f6;
`;

const DoneButton = styled(Link)`
  margin-top: 8px;
  padding: 14px 24px;
  border: 0;
  border-radius: 12px;
  background: #3182f6;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
`;
