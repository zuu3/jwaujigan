"use client";

import styled from "@emotion/styled";
import { ArrowRight, Crosshair, Search } from "lucide-react";
import {
  DISTRICT_AREA_OPTIONS,
  DISTRICT_PROVINCES,
  normalizeKoreanText,
  type DistrictAreaOption,
} from "@/lib/districts/catalog";
import { StatusLabel, StatusValue, StatusHint } from "./index";

type GeolocationFailure = {
  code?: number;
  message?: string;
};

function getCurrentPosition(options?: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(
        new Error(
          "브라우저 보안 정책 때문에 현재 위치를 사용할 수 없습니다. HTTPS 또는 localhost에서 접속해 주세요.",
        ),
      );
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error("브라우저가 위치 정보를 지원하지 않습니다."));
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
        return "위치 권한이 차단되어 있습니다. 아래에서 직접 지역구를 선택하세요.";
      case 2:
        return "현재 위치를 확인하지 못했습니다. 잠시 후 다시 시도하거나 직접 선택하세요.";
      case 3:
        return "위치 확인 시간이 초과됐습니다. 다시 시도하거나 직접 선택하세요.";
      default:
        return error.message ?? "현재 위치를 확인하지 못했습니다.";
    }
  }

  return "현재 위치를 확인하지 못했습니다.";
}

const MANUAL_MATCH_LIMIT = 8;

export function getManualResultScore(
  option: DistrictAreaOption,
  normalizedQuery: string,
) {
  const normalizedArea = normalizeKoreanText(option.areaLabel);
  const normalizedDistrict = normalizeKoreanText(option.districtLabel);

  if (normalizedArea === normalizedQuery) {
    return 4;
  }

  if (normalizedArea.startsWith(normalizedQuery)) {
    return 3;
  }

  if (normalizedDistrict.startsWith(normalizedQuery)) {
    return 2;
  }

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
  onResolveLocation: () => Promise<void>;
  onManualDistrictSelect: (option: DistrictAreaOption) => Promise<void>;
  onProvinceChange: (province: string) => void;
  onManualQueryChange: (query: string) => void;
  onContinueToQuestions: () => void;
};

export function DistrictStep({
  district,
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
  onResolveLocation,
  onManualDistrictSelect,
  onProvinceChange,
  onManualQueryChange,
  onContinueToQuestions,
}: DistrictStepProps) {
  const isResolvingDistrict = isResolvingLocation || isSavingManualDistrict;

  return (
    <>
      <DistrictSection>
        <DistrictMeta>
          <DistrictTitle>현재 위치 또는 직접 검색</DistrictTitle>
          <DistrictDescription>
            위치가 잡히지 않으면 시/도와 행정동 이름으로 찾으세요.
          </DistrictDescription>
        </DistrictMeta>

        <DistrictPanel>
          <DistrictStatus>
            <StatusLabel>현재 지역구</StatusLabel>
            <StatusValue>{district ?? "설정되지 않음"}</StatusValue>
            {resolvedAddress ? (
              <StatusHint>{resolvedAddress}</StatusHint>
            ) : initialDistrict ? (
              <StatusHint>저장된 지역구를 그대로 사용할 수 있습니다.</StatusHint>
            ) : (
              <StatusHint>지역구를 정하면 다음 단계로 이동합니다.</StatusHint>
            )}
          </DistrictStatus>

          <SectionRow>
            <SectionRowText>
              <SectionRowTitle>현재 위치로 찾기</SectionRowTitle>
              <SectionRowDescription>
                브라우저 위치 권한을 허용하면 자동으로 선거구를 찾습니다.
              </SectionRowDescription>
            </SectionRowText>
            <LocationButton
              type="button"
              onClick={() => void onResolveLocation()}
              disabled={isResolvingDistrict}
            >
              <Crosshair size={16} />
              <span>
                {isResolvingLocation ? "확인 중" : "위치 찾기"}
              </span>
            </LocationButton>
          </SectionRow>

          <ManualFinder>
            <ManualFinderHeader>
              <ManualFinderTitle>직접 찾기</ManualFinderTitle>
              <ManualFinderDescription>
                시/도와 동 이름을 입력하고 결과를 선택하세요.
              </ManualFinderDescription>
            </ManualFinderHeader>

            <ManualFinderControls>
              <ProvinceSelect
                value={selectedProvince}
                onChange={(event) => onProvinceChange(event.target.value)}
                disabled={isResolvingDistrict}
              >
                <option value="all">전체 시/도</option>
                {DISTRICT_PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </ProvinceSelect>

              <ManualSearchField>
                <Search size={16} />
                <ManualSearchInput
                  value={manualQuery}
                  onChange={(event) => onManualQueryChange(event.target.value)}
                  placeholder="예: 서교동, 분당동, 해운대구"
                  disabled={isResolvingDistrict}
                />
              </ManualSearchField>
            </ManualFinderControls>

            {normalizedManualQuery ? (
              manualMatches.length > 0 ? (
                <ManualResultList>
                  {manualMatches.map((option) => (
                    <ManualResultButton
                      key={option.id}
                      type="button"
                      onClick={() => void onManualDistrictSelect(option)}
                      disabled={isResolvingDistrict}
                    >
                      <ManualResultText>
                        <ManualResultArea>{option.areaLabel}</ManualResultArea>
                        <ManualResultMeta>
                          {[option.province, option.districtLabel]
                            .filter(Boolean)
                            .join(" · ")}
                        </ManualResultMeta>
                      </ManualResultText>
                      <ManualResultAction
                        $selected={district === option.district}
                      >
                        {savingManualOptionId === option.id
                          ? "저장 중"
                          : district === option.district
                            ? "선택됨"
                            : "선택"}
                      </ManualResultAction>
                    </ManualResultButton>
                  ))}
                </ManualResultList>
              ) : (
                <ManualEmptyState>
                  일치하는 행정동이 없습니다. 시/도를 고르거나 동 이름을 더 입력하세요.
                </ManualEmptyState>
              )
            ) : (
              <ManualHint>
                시/도와 동 이름을 함께 입력하면 더 빨리 찾을 수 있습니다.
              </ManualHint>
            )}
          </ManualFinder>

          {districtNotice ? <HelperText>{districtNotice}</HelperText> : null}
          {districtError ? <ErrorText>{districtError}</ErrorText> : null}

          <StepActionRow>
            <NextStepHint>
              {district
                ? "선택한 지역구로 다음 단계로 이동합니다."
                : "위치 찾기 또는 검색 결과를 먼저 선택하세요."}
            </NextStepHint>
            <PrimaryActionButton
              type="button"
              onClick={onContinueToQuestions}
              disabled={!district || isResolvingDistrict}
            >
              다음
              <ArrowRight size={16} />
            </PrimaryActionButton>
          </StepActionRow>
        </DistrictPanel>
      </DistrictSection>
    </>
  );
}

export { getLocationErrorMessage, resolveCurrentPosition, MANUAL_MATCH_LIMIT };

const DistrictSection = styled.section`
  display: grid;
  gap: 40px;
  margin-bottom: 40px;
`;

const DistrictMeta = styled.div`
  display: grid;
  gap: 8px;
`;

const DistrictTitle = styled.h2`
  margin: 0;
  color: #191f28;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  word-break: keep-all;
`;

const DistrictDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  line-height: 1.55;
  word-break: keep-all;
`;

const DistrictPanel = styled.div`
  display: grid;
  gap: 32px;
`;

const DistrictStatus = styled.div`
  display: grid;
  gap: 6px;
  padding: 16px 0;
  border-top: 1px solid #f2f4f6;
  border-bottom: 1px solid #f2f4f6;
`;

const SectionRow = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SectionRowText = styled.div`
  display: grid;
  gap: 4px;
`;

const SectionRowTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
`;

const SectionRowDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;
`;

const LocationButton = styled.button`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #191f28;
  background: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:enabled {
    background: #f9fafb;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ManualFinder = styled.section`
  display: grid;
  gap: 16px;
`;

const ManualFinderHeader = styled.div`
  display: grid;
  gap: 4px;
`;

const ManualFinderTitle = styled.h3`
  margin: 0;
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
`;

const ManualFinderDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;
`;

const ManualFinderControls = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 200px) minmax(0, 1fr);
  gap: 8px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ProvinceSelect = styled.select`
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #191f28;
  background: #ffffff;
  font-size: 14px;
  appearance: none;
`;

const ManualSearchField = styled.label`
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #8b95a1;
  background: #ffffff;
`;

const ManualSearchInput = styled.input`
  width: 100%;
  border: 0;
  color: #191f28;
  background: transparent;
  font-size: 14px;
  outline: none;

  &::placeholder {
    color: #8b95a1;
  }
`;

const ManualResultList = styled.div`
  display: grid;
`;

const ManualResultButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 0;
  border: 0;
  border-bottom: 1px solid #f2f4f6;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover:enabled {
    background: #f9fafb;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const ManualResultText = styled.div`
  display: grid;
  gap: 2px;
`;

const ManualResultArea = styled.div`
  color: #191f28;
  font-size: 16px;
  font-weight: 600;
`;

const ManualResultMeta = styled.div`
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.4;
`;

const ManualResultAction = styled.div<{ $selected: boolean }>`
  color: ${({ $selected }) => ($selected ? "#191f28" : "#4e5968")};
  font-size: 14px;
  font-weight: ${({ $selected }) => ($selected ? 700 : 500)};
  white-space: nowrap;
`;

const ManualHint = styled.div`
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.5;
  word-break: keep-all;
`;

const ManualEmptyState = styled.div`
  padding: 14px 0;
  color: #8b95a1;
  font-size: 14px;
  line-height: 1.5;
`;

const StepActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid #f2f4f6;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const NextStepHint = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
`;

const PrimaryActionButton = styled.button`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 20px;
  border: 0;
  border-radius: 8px;
  color: #ffffff;
  background: #191f28;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:hover:enabled {
    background: #333d4b;
  }

  &:disabled {
    color: #8b95a1;
    background: #f2f4f6;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const HelperText = styled.div`
  color: #3182f6;
  font-size: 14px;
  font-weight: 500;
`;

const ErrorText = styled.div`
  color: #e5484d;
  font-size: 14px;
  font-weight: 500;
`;
