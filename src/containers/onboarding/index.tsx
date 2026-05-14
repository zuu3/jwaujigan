"use client";

import styled from "@emotion/styled";
import { useFunnel } from "@use-funnel/browser";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";
import { FullScreenLoader } from "@/components/loading/full-screen-loader";
import { DISTRICT_AREA_OPTIONS, normalizeKoreanText } from "@/lib/districts/catalog";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import { useOnboardingStore } from "./store";
import {
  DistrictStep,
  getLocationErrorMessage,
  getManualResultScore,
  resolveCurrentPosition,
  MANUAL_MATCH_LIMIT,
} from "./DistrictStep";
import { QuestionsStep } from "./QuestionsStep";
import { questions } from "./questions";

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
      setDistrictError("지역구를 먼저 선택하세요.");
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

  const handleManualDistrictSelect = async (option: import("@/lib/districts/catalog").DistrictAreaOption) => {
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
      setDistrictError("지역구를 먼저 설정하세요.");
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

      // 초대 코드가 localStorage에 있으면 referral complete 처리 (fire-and-forget)
      const storedRefCode = typeof window !== "undefined"
        ? localStorage.getItem("referral_code")
        : null;
      if (storedRefCode) {
        void fetch("/api/me/referral/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: storedRefCode }),
        }).then(() => {
          localStorage.removeItem("referral_code");
        }).catch(() => null);
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
          description="정치 성향을 분석한 뒤 홈으로 이동합니다."
        />
      ) : null}
      <TopBar>
        <TopBarInner>
          <TopText>정치 성향 테스트</TopText>
          {step === "questions" ? (
            <SkipButton type="button" onClick={handleSkip} disabled={isSubmitting}>
              건너뛰기
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
                <StepChip>1 / 2 지역구</StepChip>
                <StepTitle>먼저 지역구를 선택하세요</StepTitle>
                <StepDescription>
                  현재 위치로 찾거나 행정동을 검색해 지역구를 저장합니다.
                </StepDescription>
              </StepHeader>

              <DistrictStep
                district={district}
                resolvedAddress={resolvedAddress}
                initialDistrict={initialDistrict}
                isResolvingLocation={isResolvingLocation}
                isSavingManualDistrict={isSavingManualDistrict}
                savingManualOptionId={savingManualOptionId}
                selectedProvince={selectedProvince}
                manualQuery={manualQuery}
                normalizedManualQuery={normalizedManualQuery}
                manualMatches={manualMatches}
                districtError={districtError}
                districtNotice={districtNotice}
                onResolveLocation={handleResolveLocation}
                onManualDistrictSelect={handleManualDistrictSelect}
                onProvinceChange={setSelectedProvince}
                onManualQueryChange={setManualQuery}
                onContinueToQuestions={handleContinueToQuestions}
              />
            </>
          ) : (
            <>
              <StepHeader>
                <StepChip>2 / 2 정치 성향 테스트</StepChip>
                <StepTitle>정치 성향 테스트</StepTitle>
                <StepDescription>
                  지역구 선택은 끝났습니다. 답변을 마치면 홈으로 이동합니다.
                </StepDescription>
              </StepHeader>

              <QuestionsStep
                district={district}
                resolvedAddress={resolvedAddress}
                currentIndex={currentIndex}
                canAnswer={canAnswer}
                currentSelection={currentSelection}
                isSubmitting={isSubmitting}
                onAnswer={handleAnswer}
                onBackToDistrictStep={handleBackToDistrictStep}
              />
            </>
          )}
        </ContentInner>
      </Content>
    </Page>
  );
}

// Shared styled components — exported for use in DistrictStep and QuestionsStep
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

export const SecondaryActionButton = styled.button`
  min-height: 44px;
  padding: 0 14px;
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

const Page = styled.main`
  min-height: 100vh;
  background: #ffffff;
  color: #191f28;
`;

const TopBar = styled.div`
  padding: 20px 24px 0;

  @media (max-width: 640px) {
    padding: 16px 20px 0;
  }
`;

const TopBarInner = styled.div`
  display: flex;
  width: min(100%, 760px);
  align-items: center;
  justify-content: space-between;
  margin: 0 auto;
`;

const TopText = styled.div`
  color: #4e5968;
  font-size: 14px;
  font-weight: 600;
`;

const TopBarSpacer = styled.div`
  width: 80px;
  height: 44px;
`;

const SkipButton = styled.button`
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: 8px;
  color: #4e5968;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;

  &:hover:enabled {
    color: #191f28;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`;

const Content = styled.section`
  display: flex;
  justify-content: center;
  padding: 40px 24px 80px;

  @media (max-width: 640px) {
    padding: 32px 20px 64px;
  }
`;

const ContentInner = styled.div`
  width: min(100%, 760px);
`;

const StepHeader = styled.div`
  display: grid;
  gap: 12px;
  margin-bottom: 40px;
`;

const StepChip = styled.div`
  color: #8b95a1;
  font-size: 14px;
  font-weight: 500;
`;

const StepTitle = styled.h1`
  margin: 0;
  color: #191f28;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 24px;
  }
`;

const StepDescription = styled.p`
  margin: 0;
  color: #4e5968;
  font-size: 16px;
  font-weight: 400;
  line-height: 1.55;
  word-break: keep-all;
`;
