"use client";

import styled from "@emotion/styled";
import { useFunnel } from "@use-funnel/browser";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crosshair, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { FullScreenLoader } from "@/components/loading/full-screen-loader";
import { TargetCursor } from "@/components/cursor/target-cursor";
import {
  DISTRICT_AREA_OPTIONS,
  DISTRICT_PROVINCES,
  normalizeKoreanText,
  type DistrictAreaOption,
} from "@/lib/districts/catalog";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import { questions, likertOptions } from "./questions";
import { useOnboardingStore } from "./store";

type OnboardingContainerProps = {
  initialDistrict: string | null;
};

type OnboardingStep = "district" | "questions";

type OnboardingFunnel = {
  district: {
    district: string | null;
    resolvedAddress: string | null;
  };
  questions: {
    district: string;
    resolvedAddress: string | null;
  };
};

type DistrictResponse = {
  district: string;
  province: string | null;
  matchedArea: string | null;
  sourceAddress: string;
};

type DistrictRequestPayload = {
  latitude?: number;
  longitude?: number;
  district?: string;
  matchedArea?: string;
  sourceAddress?: string;
};

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
        return "브라우저 위치 권한이 차단되어 있습니다. 아래에서 직접 지역구를 선택해 주세요.";
      case 2:
        return "현재 위치를 정확히 확인하지 못했습니다. 잠시 후 다시 시도하거나 직접 지역구를 선택해 주세요.";
      case 3:
        return "현재 위치 확인 시간이 초과됐습니다. 다시 시도하거나 직접 지역구를 선택해 주세요.";
      default:
        return error.message ?? "현재 위치를 확인하지 못했습니다. 아래에서 직접 지역구를 선택해 주세요.";
    }
  }

  return "현재 위치를 확인하지 못했습니다. 아래에서 직접 지역구를 선택해 주세요.";
}

const MANUAL_MATCH_LIMIT = 8;

function getManualResultScore(
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

export function OnboardingContainer({
  initialDistrict,
}: OnboardingContainerProps) {
  const router = useRouter();
  const initialFunnelState = useMemo(
    () =>
      initialDistrict
        ? {
            step: "questions" as const,
            context: {
              district: initialDistrict,
              resolvedAddress: null,
            },
          }
        : {
            step: "district" as const,
            context: {
              district: null,
              resolvedAddress: null,
            },
          },
    [initialDistrict],
  );
  const funnel = useFunnel<OnboardingFunnel>({
    id: "onboarding",
    initial: initialFunnelState,
    steps: {
      district: {
        parse: (data) => {
          const context =
            typeof data === "object" && data !== null
              ? (data as Partial<OnboardingFunnel["district"]>)
              : {};

          return {
            district:
              typeof context.district === "string" ? context.district : null,
            resolvedAddress:
              typeof context.resolvedAddress === "string"
                ? context.resolvedAddress
                : null,
          };
        },
      },
      questions: {
        guard: (data): data is OnboardingFunnel["questions"] =>
          typeof data === "object" &&
          data !== null &&
          typeof (data as Partial<OnboardingFunnel["questions"]>).district ===
            "string",
      },
    },
  });
  const currentIndex = useOnboardingStore((state) => state.currentIndex);
  const answerQuestion = useOnboardingStore((state) => state.answerQuestion);
  const nextQuestion = useOnboardingStore((state) => state.nextQuestion);
  const reset = useOnboardingStore((state) => state.reset);
  const answers = useOnboardingStore((state) => state.answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const step: OnboardingStep = funnel.step;
  const [district, setDistrict] = useState(initialDistrict);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [districtNotice, setDistrictNotice] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSavingManualDistrict, setIsSavingManualDistrict] = useState(false);
  const [savingManualOptionId, setSavingManualOptionId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [manualQuery, setManualQuery] = useState("");

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isResolvingDistrict = isResolvingLocation || isSavingManualDistrict;
  const canAnswer = Boolean(district) && !isSubmitting && !isResolvingDistrict;
  const currentSelection = useMemo(
    () => answers[question.id],
    [answers, question.id],
  );
  const deferredManualQuery = useDeferredValue(manualQuery);
  const normalizedManualQuery = useMemo(
    () => normalizeKoreanText(deferredManualQuery),
    [deferredManualQuery],
  );
  const manualMatches = useMemo(() => {
    if (!normalizedManualQuery) {
      return [];
    }

    return DISTRICT_AREA_OPTIONS
      .filter((option) => {
        if (
          selectedProvince !== "all" &&
          option.province !== selectedProvince
        ) {
          return false;
        }

        return option.searchText.includes(normalizedManualQuery);
      })
      .sort((left, right) => {
        const scoreDiff =
          getManualResultScore(right, normalizedManualQuery) -
          getManualResultScore(left, normalizedManualQuery);

        if (scoreDiff !== 0) {
          return scoreDiff;
        }

        return left.areaLabel.localeCompare(right.areaLabel, "ko");
      })
      .slice(0, MANUAL_MATCH_LIMIT);
  }, [normalizedManualQuery, selectedProvince]);

  const handleSkip = () => {
    document.cookie = `${ONBOARDING_SKIP_COOKIE}=true; path=/; max-age=604800`;
    reset();
    router.push("/home?skip=true");
  };

  const saveDistrict = async (payload: DistrictRequestPayload) => {
    const response = await fetch("/api/district", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as DistrictResponse & {
      message?: string;
    };

    if (!response.ok) {
      throw new Error(result.message ?? "Failed to resolve district.");
    }

    setDistrict(result.district);
    setResolvedAddress(result.sourceAddress);
    if (funnel.step === "questions") {
      void funnel.history.replace("questions", {
        district: result.district,
        resolvedAddress: result.sourceAddress,
      });
    } else {
      void funnel.history.replace("district", {
        district: result.district,
        resolvedAddress: result.sourceAddress,
      });
    }
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
    router.refresh();
  };

  const handleResolveLocation = async () => {
    setIsResolvingLocation(true);
    setDistrictError(null);
    setDistrictNotice(null);

    try {
      const position = await resolveCurrentPosition();
      await saveDistrict({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      setManualQuery("");
    } catch (error) {
      console.error(error);
      setDistrictError(getLocationErrorMessage(error));
    } finally {
      setIsResolvingLocation(false);
    }
  };

  const handleContinueToQuestions = () => {
    if (!district) {
      setDistrictError("정치 성향 테스트 전에 지역구를 먼저 선택해 주세요.");
      return;
    }

    void funnel.history.push("questions", {
      district,
      resolvedAddress,
    });
  };

  const handleBackToDistrictStep = () => {
    if (funnel.index > 0) {
      void funnel.history.back();
      return;
    }

    void funnel.history.replace("district", {
      district,
      resolvedAddress,
    });
  };

  const handleManualDistrictSelect = async (option: DistrictAreaOption) => {
    setIsSavingManualDistrict(true);
    setSavingManualOptionId(option.id);
    setDistrictError(null);
    setDistrictNotice(null);

    try {
      await saveDistrict({
        district: option.district,
        matchedArea: option.areaLabel,
        sourceAddress: [option.province, option.areaLabel].filter(Boolean).join(" "),
      });
    } catch (error) {
      console.error(error);
      setDistrictError(
        error instanceof Error
          ? error.message
          : "선택한 지역구를 저장하지 못했습니다.",
      );
    } finally {
      setIsSavingManualDistrict(false);
      setSavingManualOptionId(null);
    }
  };

  const handleAnswer = async (score: number) => {
    if (!district) {
      setDistrictError("테스트를 마치기 전에 지역구를 먼저 설정해 주세요.");
      return;
    }

    if (isSubmitting || isResolvingDistrict) {
      return;
    }

    const nextAnswers = answerQuestion(question.id, score);

    if (!isLastQuestion) {
      nextQuestion();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/political-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers: nextAnswers,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save political profile.");
      }

      document.cookie = `${ONBOARDING_SKIP_COOKIE}=; path=/; max-age=0`;
      reset();
      router.push("/home");
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <Page>
      {isSubmitting ? (
        <FullScreenLoader
          title="결과를 저장하고 있어요"
          description="정치 성향을 분석한 뒤 홈으로 이동합니다. 잠시만 기다려 주세요."
        />
      ) : null}
      <TopBar>
        <TopBarInner>
          <TopText>정치 성향 테스트</TopText>
          {step === "questions" ? (
            <SkipButton type="button" onClick={handleSkip} disabled={isSubmitting}>
              테스트 건너뛰기
            </SkipButton>
          ) : (
            <TopBarSpacer aria-hidden="true" />
          )}
        </TopBarInner>
      </TopBar>

      <Content>
        <ContentInner>
          {step === "district" ? (
            <>
              <StepHeader>
                <StepChip>1 / 2 지역구 선택</StepChip>
                <StepTitle>먼저 내 지역구를 정해 주세요</StepTitle>
                <StepDescription>
                  현재 위치로 찾거나 행정동을 검색해 지역구를 저장한 뒤 다음 단계로
                  이동합니다.
                </StepDescription>
              </StepHeader>

              <DistrictSection>
                <DistrictMeta>
                  <DistrictEyebrow>내 지역부터 설정</DistrictEyebrow>
                  <DistrictTitle>현재 위치나 직접 검색으로 지역구를 선택해 주세요</DistrictTitle>
                  <DistrictDescription>
                    현재 위치가 안 잡히면 시/도와 행정동 이름으로 바로 찾을 수 있습니다.
                  </DistrictDescription>
                </DistrictMeta>

                <DistrictPanel>
                  <DistrictStatus>
                    <StatusLabel>현재 지역구</StatusLabel>
                    <StatusValue>{district ?? "아직 설정되지 않았습니다"}</StatusValue>
                    {resolvedAddress ? (
                      <StatusHint>{resolvedAddress}</StatusHint>
                    ) : initialDistrict ? (
                      <StatusHint>이미 저장된 지역구를 그대로 사용할 수 있습니다.</StatusHint>
                    ) : (
                      <StatusHint>지역구를 정하면 다음 단계에서 정치 성향 테스트를 시작합니다.</StatusHint>
                    )}
                  </DistrictStatus>

                  <LocationCard>
                    <LocationCopy>
                      <LocationTitle>현재 위치로 찾기</LocationTitle>
                      <LocationDescription>
                        브라우저 위치 권한을 허용하면 현재 위치 기준 선거구를 바로 찾습니다.
                      </LocationDescription>
                    </LocationCopy>
                    <LocationButton
                      type="button"
                      onClick={() => void handleResolveLocation()}
                      disabled={isResolvingDistrict}
                    >
                      <Crosshair size={16} />
                      <span>
                        {isResolvingLocation ? "현재 위치 확인 중" : "현재 위치로 찾기"}
                      </span>
                    </LocationButton>
                  </LocationCard>

                  <ManualFinder>
                    <ManualFinderHeader>
                      <ManualFinderTitle>직접 찾기</ManualFinderTitle>
                      <ManualFinderDescription>
                        시/도와 동 이름으로 찾고, 결과를 선택한 뒤 아래 다음 버튼을 눌러
                        이동합니다.
                      </ManualFinderDescription>
                    </ManualFinderHeader>

                    <ManualFinderControls>
                      <ProvinceSelect
                        value={selectedProvince}
                        onChange={(event) => setSelectedProvince(event.target.value)}
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
                          onChange={(event) => setManualQuery(event.target.value)}
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
                              onClick={() => void handleManualDistrictSelect(option)}
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
                          일치하는 행정동을 찾지 못했습니다. 시/도를 고르거나 동 이름을 더 자세히
                          입력해 주세요.
                        </ManualEmptyState>
                      )
                    ) : (
                      <ManualHint>
                        서울특별시 + 서교동, 경기도 + 분당동처럼 입력하면 더 빨리 찾을 수
                        있어요.
                      </ManualHint>
                    )}
                  </ManualFinder>

                  {districtNotice ? <HelperText>{districtNotice}</HelperText> : null}
                  {districtError ? <ErrorText>{districtError}</ErrorText> : null}

                  <StepActionRow>
                    <NextStepHint>
                      {district
                        ? "선택한 지역구를 확인하고 다음 단계로 이동하세요."
                        : "현재 위치로 찾거나 검색 결과를 먼저 선택하세요."}
                    </NextStepHint>
                    <PrimaryActionButton
                      type="button"
                      onClick={handleContinueToQuestions}
                      disabled={!district || isResolvingDistrict}
                    >
                      다음
                      <ArrowRight size={17} />
                    </PrimaryActionButton>
                  </StepActionRow>
                </DistrictPanel>
              </DistrictSection>
            </>
          ) : (
            <>
              <StepHeader>
                <StepChip>2 / 2 정치 성향 테스트</StepChip>
                <StepTitle>정치 성향 테스트를 마무리해 주세요</StepTitle>
                <StepDescription>
                  지역구 선택은 끝났습니다. 아래 답변만 완료하면 홈으로 이동합니다.
                </StepDescription>
              </StepHeader>

              <DistrictSummaryCard>
                <DistrictSummaryText>
                  <StatusLabel>선택한 지역구</StatusLabel>
                  <StatusValue>{district ?? "아직 설정되지 않았습니다"}</StatusValue>
                  {resolvedAddress ? <StatusHint>{resolvedAddress}</StatusHint> : null}
                </DistrictSummaryText>
                <SecondaryActionButton
                  type="button"
                  onClick={handleBackToDistrictStep}
                  disabled={isSubmitting}
                >
                  지역구 다시 선택
                </SecondaryActionButton>
              </DistrictSummaryCard>

              <Header>
                <ProgressMeta>
                  <ProgressText>
                    질문 {currentIndex + 1}/{questions.length}
                  </ProgressText>
                  <ProgressTitle>가장 가까운 입장을 골라 주세요</ProgressTitle>
                </ProgressMeta>

                <ProgressBar>
                  <ProgressFill style={{ width: `${progress}%` }} />
                </ProgressBar>
              </Header>

              <QuestionStage>
                <AnimatePresence mode="wait">
                  <QuestionCard
                    key={question.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -24 }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
                  >
                    <QuestionEyebrow>{question.axis.toUpperCase()}</QuestionEyebrow>
                    <QuestionText>{question.text}</QuestionText>
                  </QuestionCard>
                </AnimatePresence>
              </QuestionStage>

              <AnswerGrid>
                {likertOptions.map((option) => (
                  <AnswerButton
                    key={option.label}
                    type="button"
                    data-cursor-target="onboarding-answer"
                    onClick={() => void handleAnswer(option.value)}
                    disabled={!canAnswer}
                    $selected={currentSelection === option.value}
                  >
                    <span>{option.label}</span>
                    <ArrowRight size={16} />
                  </AnswerButton>
                ))}
              </AnswerGrid>
            </>
          )}
        </ContentInner>
      </Content>
      {step === "questions" ? (
        <TargetCursor
          targetSelector='[data-cursor-target="onboarding-answer"]'
          spinDuration={3.2}
          hoverDuration={0.14}
        />
      ) : null}
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  background: #eef2f7;
  color: var(--adaptiveGrey900);
`;

const TopBar = styled.div`
  padding: 18px 24px 0;

  @media (max-width: 640px) {
    padding: 16px 20px 0;
  }
`;

const TopBarInner = styled.div`
  display: flex;
  width: min(100%, 960px);
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
`;

const TopText = styled.div`
  color: #4e5968;
  font-size: 0.92rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const TopBarSpacer = styled.div`
  width: 116px;
  height: 44px;
`;

const SkipButton = styled.button`
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  color: var(--adaptiveGrey700);
  background: var(--adaptiveBlue50);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Content = styled.section`
  display: flex;
  justify-content: center;
  padding: 30px 24px 64px;

  @media (max-width: 640px) {
    padding: 28px 20px 48px;
  }
`;

const ContentInner = styled.div`
  width: min(100%, 960px);
`;

const StepHeader = styled.div`
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin-bottom: 24px;
`;

const StepChip = styled.div`
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  color: #064b9f;
  background: #dbeafe;
  font-size: 0.86rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const StepTitle = styled.h1`
  margin: 0;
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: 0;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 2rem;
  }
`;

const StepDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-weight: 650;
  line-height: 1.6;
  word-break: keep-all;
`;

const DistrictSection = styled.section`
  display: grid;
  grid-template-columns: minmax(260px, 0.82fr) minmax(0, 1.18fr);
  align-items: start;
  gap: 22px;
  margin-bottom: 32px;
  padding: 28px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius-card);
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.12);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }

  @media (max-width: 640px) {
    padding: 20px;
    border-radius: 20px;
  }
`;

const DistrictMeta = styled.div`
  display: grid;
  align-content: start;
  gap: 12px;
  min-height: 100%;
  padding: 22px;
  border-radius: var(--radius-control);
  color: #ffffff;
  background: #172033;
`;

const DistrictEyebrow = styled.div`
  color: #93c5fd;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const DistrictTitle = styled.h2`
  margin: 0;
  font-size: 1.85rem;
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: 0;
  word-break: keep-all;
`;

const DistrictDescription = styled.p`
  margin: 0;
  color: #d7deea;
  line-height: 1.6;
  word-break: keep-all;
`;

const DistrictPanel = styled.div`
  display: grid;
  gap: 14px;
`;

const DistrictStatus = styled.div`
  display: grid;
  gap: 6px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-control);
  background: #eff6ff;
`;

const StatusLabel = styled.div`
  color: #4e5968;
  font-size: 0.85rem;
  font-weight: 700;
`;

const StatusValue = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;

  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: #3182f6;
    flex: 0 0 auto;
  }
`;

const StatusHint = styled.div`
  color: #4e5968;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const LocationCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: var(--radius-control);
  background: #eaf4ff;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const LocationCopy = styled.div`
  display: grid;
  gap: 5px;
`;

const LocationTitle = styled.h3`
  margin: 0;
  color: var(--adaptiveGrey900);
  font-size: 1rem;
  font-weight: 800;
`;

const LocationDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.5;
  word-break: keep-all;
`;

const LocationButton = styled.button`
  display: inline-flex;
  min-width: 172px;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--radius-control);
  color: var(--white);
  background: #3182f6;
  font-size: 0.94rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const ManualFinder = styled.section`
  display: grid;
  gap: 14px;
  padding: 20px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius-control);
  background: #f8fafc;
`;

const ManualFinderHeader = styled.div`
  display: grid;
  gap: 6px;
`;

const ManualFinderTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const ManualFinderDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 0.92rem;
  line-height: 1.5;
  word-break: keep-all;
`;

const ManualFinderControls = styled.div`
  display: grid;
  grid-template-columns: minmax(170px, 220px) minmax(0, 1fr);
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const ProvinceSelect = styled.select`
  min-height: 54px;
  padding: 0 16px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-control);
  color: var(--adaptiveGrey900);
  background: #ffffff;
  appearance: none;
`;

const ManualSearchField = styled.label`
  display: flex;
  min-height: 54px;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-control);
  color: var(--adaptiveGrey600);
  background: #ffffff;
`;

const ManualSearchInput = styled.input`
  width: 100%;
  border: 0;
  color: var(--adaptiveGrey900);
  background: transparent;
  font-size: 0.96rem;
  outline: none;

  &::placeholder {
    color: var(--adaptiveGrey500);
  }
`;

const ManualResultList = styled.div`
  display: grid;
  gap: 8px;
`;

const ManualResultButton = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 18px;
  border: 1px solid #cbd5e1;
  border-radius: var(--radius-control);
  background: #ffffff;
  text-align: left;
  cursor: pointer;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;

  &:hover:enabled {
    transform: translateY(-1px);
    border-color: var(--adaptiveBlue200);
    box-shadow: var(--shadow-card);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.72;
  }
`;

const ManualResultText = styled.div`
  display: grid;
  gap: 4px;
`;

const ManualResultArea = styled.div`
  font-size: 0.98rem;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const ManualResultMeta = styled.div`
  color: #4e5968;
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ManualResultAction = styled.div<{ $selected: boolean }>`
  min-width: 54px;
  padding: 7px 10px;
  border-radius: 999px;
  color: ${({ $selected }) => ($selected ? "#ffffff" : "#064b9f")};
  background: ${({ $selected }) => ($selected ? "#3182f6" : "#dbeafe")};
  font-size: 0.9rem;
  font-weight: 800;
  text-align: center;
  white-space: nowrap;
`;

const ManualHint = styled.div`
  color: #4e5968;
  font-size: 0.9rem;
  line-height: 1.5;
  word-break: keep-all;
`;

const ManualEmptyState = styled.div`
  padding: 14px 16px;
  border-radius: 18px;
  color: var(--adaptiveGrey600);
  background: var(--adaptiveGreyOpacity50);
  font-size: 0.9rem;
  line-height: 1.5;
`;

const StepActionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 0 0;
  border-top: 1px solid #d8e1ee;

  @media (max-width: 640px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const NextStepHint = styled.div`
  color: #4e5968;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.45;
`;

const PrimaryActionButton = styled.button`
  display: inline-flex;
  min-height: 54px;
  min-width: 132px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 22px;
  border: 0;
  border-radius: var(--radius-control);
  color: var(--white);
  background: #3182f6;
  font-size: 0.96rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    color: #8b95a1;
    background: #e5e8eb;
    cursor: not-allowed;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const SecondaryActionButton = styled.button`
  min-height: 48px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--radius-control);
  color: var(--adaptiveBlue700);
  background: var(--adaptiveBlue50);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    width: 100%;
  }
`;

const HelperText = styled.div`
  color: var(--adaptiveBlue700);
  font-size: 0.92rem;
  font-weight: 600;
`;

const ErrorText = styled.div`
  color: var(--adaptiveRed600);
  font-size: 0.92rem;
  font-weight: 600;
`;

const Header = styled.div`
  max-width: 720px;
`;

const DistrictSummaryCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  padding: 20px 22px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius-card);
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DistrictSummaryText = styled.div`
  display: grid;
  gap: 6px;
`;

const ProgressMeta = styled.div`
  display: grid;
  gap: 10px;
`;

const ProgressText = styled.div`
  color: #2563eb;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const ProgressTitle = styled.h1`
  margin: 0;
  font-size: 2.75rem;
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: 0;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 2rem;
  }
`;

const ProgressBar = styled.div`
  height: 8px;
  margin-top: 24px;
  border-radius: 999px;
  background: #d8e1ee;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #3182f6;
  transition: width 220ms ease;
`;

const QuestionStage = styled.div`
  margin-top: 28px;
`;

const QuestionCard = styled(motion.div)`
  min-height: 250px;
  padding: 30px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius-card);
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.12);

  @media (max-width: 640px) {
    min-height: 220px;
    padding: 22px;
    border-radius: 20px;
  }
`;

const QuestionEyebrow = styled.div`
  color: #2563eb;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

const QuestionText = styled.p`
  margin: 18px 0 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: 0;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 1.45rem;
  }
`;

const AnswerGrid = styled.div`
  display: grid;
  margin-top: 22px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  border: 1px solid #d8e1ee;
  border-radius: var(--radius-card);
  background: #ffffff;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const AnswerButton = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 66px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid
    ${({ $selected }) =>
      $selected ? "#3182f6" : "#d8e1ee"};
  border-radius: var(--radius-control);
  color: ${({ $selected }) =>
    $selected ? "#064b9f" : "var(--adaptiveGrey900)"};
  background: ${({ $selected }) =>
    $selected ? "#dbeafe" : "#f8fafc"};
  font-size: 0.96rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition:
    transform 160ms ease,
    background 160ms ease,
    border-color 160ms ease;
  box-shadow: ${({ $selected }) =>
    $selected ? "0 12px 30px rgba(49, 130, 246, 0.12)" : "none"};

  &:hover:enabled {
    transform: translateY(-1px);
    border-color: #93c5fd;
    background: #eff6ff;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 960px) {
    min-height: 58px;
  }
`;
