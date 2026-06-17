"use client";

import styled from "@/lib/styled";
import { ArrowRight, CheckCircle2, Crosshair, Search } from "lucide-react";
import React from "react";
import {
  DISTRICT_AREA_OPTIONS,
  DISTRICT_PROVINCES,
  normalizeKoreanText,
  type DistrictAreaOption,
} from "@/lib/districts/catalog";

type GeolocationFailure = {
  code?: number;
  message?: string;
};

function getCurrentPosition(options?: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(
        new Error(
          "보안 정책으로 위치를 쓸 수 없어요. HTTPS 환경에서 접속해주세요.",
        ),
      );
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 정보를 지원하지 않아요."));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

function isGeolocationFailure(error: unknown): error is GeolocationFailure {
  return typeof error === "object" && error !== null && "code" in error;
}

function getLocationErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isGeolocationFailure(error)) {
    switch (error.code) {
      case 1:
        return "위치 권한이 막혀 있어요. 아래서 직접 골라주세요.";
      case 2:
        return "현재 위치를 못 찾았어요. 잠시 후 다시 시도하거나 직접 골라주세요.";
      case 3:
        return "위치 확인 시간이 지났어요. 다시 시도하거나 직접 골라주세요.";
      default:
        return error.message ?? "현재 위치를 못 찾았어요.";
    }
  }

  return "현재 위치를 못 찾았어요.";
}

const MANUAL_MATCH_LIMIT = 8;

export function getManualResultScore(
  option: DistrictAreaOption,
  normalizedQuery: string,
) {
  const normalizedArea = normalizeKoreanText(option.areaLabel);
  const normalizedDistrict = normalizeKoreanText(option.districtLabel);

  if (normalizedArea === normalizedQuery) return 4;
  if (normalizedArea.startsWith(normalizedQuery)) return 3;
  if (normalizedDistrict.startsWith(normalizedQuery)) return 2;
  return 1;
}

async function resolveCurrentPosition() {
  try {
    return await getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10_000,
      maximumAge: 0,
    });
  } catch (error) {
    if (isGeolocationFailure(error) && (error.code === 2 || error.code === 3)) {
      return getCurrentPosition({
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 300_000,
      });
    }
    throw error;
  }
}

export type DistrictStepProps = {
  district: string | null;
  selectedOptionId: string | null;
  resolvedAddress: string | null;
  initialDistrict: string | null;
  isResolvingLocation: boolean;
  isSavingManualDistrict: boolean;
  savingManualOptionId: string | null;
  selectedProvince: string;
  manualQuery: string;
  normalizedManualQuery: string;
  manualMatches: DistrictAreaOption[];
  districtError: string | null;
  districtNotice: string | null;
  referralCode: string;
  referralAutoFilled: boolean;
  onReferralCodeChange: (code: string) => void;
  onResolveLocation: () => Promise<void>;
  onManualDistrictSelect: (option: DistrictAreaOption) => Promise<void>;
  onProvinceChange: (province: string) => void;
  onManualQueryChange: (query: string) => void;
  onContinueToQuestions: () => void;
};

export function DistrictStep({
  district,
  selectedOptionId,
  resolvedAddress,
  initialDistrict,
  isResolvingLocation,
  isSavingManualDistrict,
  savingManualOptionId,
  selectedProvince,
  manualQuery,
  normalizedManualQuery,
  manualMatches,
  districtError,
  districtNotice,
  referralCode,
  referralAutoFilled,
  onReferralCodeChange,
  onResolveLocation,
  onManualDistrictSelect,
  onProvinceChange,
  onManualQueryChange,
  onContinueToQuestions,
}: DistrictStepProps) {
  const isResolvingDistrict = isResolvingLocation || isSavingManualDistrict;

  return (
    <DistrictPanel>
      {/* 1. GPS — primary path */}
      <GpsButton
        type="button"
        onClick={() => void onResolveLocation()}
        disabled={isResolvingDistrict}
        $loading={isResolvingLocation}
      >
        <Crosshair size={18} />
        {isResolvingLocation ? "위치 확인 중…" : "현재 위치로 찾기"}
      </GpsButton>

      {/* 2. Divider */}
      <OrDivider>
        <OrLine />
        <OrText>또는</OrText>
        <OrLine />
      </OrDivider>

      {/* 3. Manual search — secondary path */}
      <ManualFinder>
        <ManualFinderControls>
          <ProvinceSelect
            value={selectedProvince}
            onChange={(e) => onProvinceChange(e.target.value)}
            disabled={isResolvingDistrict}
          >
            <option value="all">전체 시/도</option>
            {DISTRICT_PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </ProvinceSelect>

          <SearchField>
            <Search size={16} aria-hidden="true" />
            <SearchInput
              value={manualQuery}
              onChange={(e) => onManualQueryChange(e.target.value)}
              placeholder="행정동 검색 (예: 서교동, 해운대구)"
              disabled={isResolvingDistrict}
            />
          </SearchField>
        </ManualFinderControls>

        {normalizedManualQuery && (
          manualMatches.length > 0 ? (
            <ResultList>
              {manualMatches.map((option) => (
                <ResultButton
                  key={option.id}
                  type="button"
                  onClick={() => void onManualDistrictSelect(option)}
                  disabled={isResolvingDistrict}
                  $selected={selectedOptionId === option.id}
                >
                  <ResultText>
                    <ResultArea>{option.areaLabel}</ResultArea>
                    <ResultMeta>
                      {[option.province, option.districtLabel].filter(Boolean).join(" · ")}
                    </ResultMeta>
                  </ResultText>
                  <ResultBadge $selected={selectedOptionId === option.id}>
                    {savingManualOptionId === option.id
                      ? "저장 중"
                      : selectedOptionId === option.id
                        ? "선택됨"
                        : "선택"}
                  </ResultBadge>
                </ResultButton>
              ))}
            </ResultList>
          ) : (
            <EmptyState>
              해당하는 행정동이 없어요. 시/도를 바꾸거나 동 이름을 더 입력해주세요.
            </EmptyState>
          )
        )}
      </ManualFinder>

      {/* 4. Feedback */}
      {districtError && <FeedbackText $type="error">{districtError}</FeedbackText>}
      {districtNotice && !districtError && (
        <FeedbackText $type="notice">{districtNotice}</FeedbackText>
      )}

      {/* 5. District confirmation chip */}
      {district && (
        <DistrictConfirm>
          <CheckCircle2 size={16} />
          <span>{district}</span>
          {resolvedAddress && <DistrictAddress>{resolvedAddress}</DistrictAddress>}
        </DistrictConfirm>
      )}

      {/* 6. Referral */}
      <ReferralSection>
        <ReferralLabel htmlFor="district-referral-code">
          추천인 코드 <ReferralOptional>(선택)</ReferralOptional>
        </ReferralLabel>
        {referralAutoFilled && (
          <ReferralNotice>추천인 코드가 자동으로 채워졌어요.</ReferralNotice>
        )}
        <ReferralInput
          id="district-referral-code"
          type="text"
          value={referralCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onReferralCodeChange(e.target.value.toUpperCase())
          }
          placeholder="예: A1B2C3D4"
          maxLength={8}
          autoComplete="off"
          spellCheck={false}
        />
      </ReferralSection>

      {/* 7. CTA */}
      <ContinueButton
        type="button"
        onClick={onContinueToQuestions}
        disabled={!district || isResolvingDistrict}
      >
        다음
        <ArrowRight size={18} />
      </ContinueButton>
    </DistrictPanel>
  );
}

export { getLocationErrorMessage, resolveCurrentPosition, MANUAL_MATCH_LIMIT };

// ─── Shared exports (used by QuestionsStep) ──────────────────────────────────

export const StatusLabel = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

export const StatusValue = styled.div`
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
`;

export const StatusHint = styled.div`
  color: #4e5968;
  font-size: 14px;
  line-height: 1.5;
`;

// ─── Styled components ────────────────────────────────────────────────────────

const DistrictPanel = styled.div`
  display: grid;
  gap: 24px;
  margin-bottom: 40px;
`;

const GpsButton = styled.button<{ $loading: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  border: 0;
  border-radius: 12px;
  background: ${({ $loading }) => ($loading ? "#2272eb" : "#3182f6")};
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;

  &:hover:enabled {
    background: #2272eb;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const OrLine = styled.div`
  flex: 1;
  height: 1px;
  background: #e5e8eb;
`;

const OrText = styled.span`
  color: #b0b8c1;
  font-size: 13px;
  font-weight: 500;
  flex-shrink: 0;
`;

const ManualFinder = styled.div`
  display: grid;
  gap: 8px;
`;

const ManualFinderControls = styled.div`
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(0, 1fr);
  gap: 8px;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const ProvinceSelect = styled.select`
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  color: #191f28;
  background: #f2f4f6;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  appearance: none;

  &:focus {
    border-color: #3182f6;
    background: #ffffff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SearchField = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f2f4f6;
  color: #b0b8c1;
  cursor: text;

  &:focus-within {
    border-color: #3182f6;
    background: #ffffff;
    color: #8b95a1;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  border: 0;
  background: transparent;
  color: #191f28;
  font-size: 14px;
  font-family: inherit;
  outline: none;

  &::placeholder {
    color: #b0b8c1;
  }

  &:disabled {
    cursor: not-allowed;
  }
`;

const ResultList = styled.div`
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  overflow: hidden;
`;

const ResultButton = styled.button<{ $selected: boolean }>`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 0;
  border-bottom: 1px solid #f2f4f6;
  background: ${({ $selected }) => ($selected ? "#e8f3ff" : "#ffffff")};
  text-align: left;
  cursor: pointer;
  transition: background 100ms;

  &:last-child {
    border-bottom: 0;
  }

  &:hover:enabled {
    background: ${({ $selected }) => ($selected ? "#e8f3ff" : "#f9fafb")};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ResultText = styled.div`
  display: grid;
  gap: 2px;
`;

const ResultArea = styled.div`
  color: #191f28;
  font-size: 15px;
  font-weight: 600;
`;

const ResultMeta = styled.div`
  color: #8b95a1;
  font-size: 13px;
  line-height: 1.4;
`;

const ResultBadge = styled.div<{ $selected: boolean }>`
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: ${({ $selected }) => ($selected ? "#3182f6" : "#f2f4f6")};
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#6b7684")};
`;

const EmptyState = styled.div`
  padding: 16px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.5;
  text-align: center;
`;

const FeedbackText = styled.div<{ $type: "error" | "notice" }>`
  font-size: 14px;
  font-weight: 500;
  color: ${({ $type }) => ($type === "error" ? "#f04452" : "#3182f6")};
`;

const DistrictConfirm = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: #e8f3ff;
  color: #3182f6;
  font-size: 15px;
  font-weight: 600;
`;

const DistrictAddress = styled.span`
  margin-left: auto;
  color: #8b95a1;
  font-size: 13px;
  font-weight: 400;
`;

const ReferralSection = styled.div`
  display: grid;
  gap: 8px;
  padding-top: 8px;
`;

const ReferralLabel = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #4e5968;
`;

const ReferralOptional = styled.span`
  font-weight: 400;
  color: #b0b8c1;
`;

const ReferralNotice = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: #3182f6;
`;

const ReferralInput = styled.input`
  height: 44px;
  padding: 0 14px;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  background: #f2f4f6;
  color: #191f28;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.08em;
  font-family: inherit;
  outline: none;
  width: 100%;
  box-sizing: border-box;

  &::placeholder {
    color: #b0b8c1;
    font-weight: 400;
    letter-spacing: 0;
  }

  &:focus {
    border-color: #3182f6;
    background: #ffffff;
  }
`;

const ContinueButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 56px;
  border: 0;
  border-radius: 12px;
  background: #3182f6;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background 150ms;

  &:hover:enabled {
    background: #2272eb;
  }

  &:disabled {
    background: #e5e8eb;
    color: #b0b8c1;
    cursor: not-allowed;
  }
`;
