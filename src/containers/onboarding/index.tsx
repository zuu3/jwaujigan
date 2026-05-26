"use client";

import styled from "@/lib/styled";
import { useFunnel } from "@use-funnel/browser";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { FullScreenLoader } from "@/components/loading/full-screen-loader";
import { DISTRICT_AREA_OPTIONS, normalizeKoreanText } from "@/lib/districts/catalog";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import dynamic from "next/dynamic";
import { useOnboardingStore } from "./store";
import {
  DistrictStep,
  getLocationErrorMessage,
  getManualResultScore,
  resolveCurrentPosition,
  MANUAL_MATCH_LIMIT,
} from "./DistrictStep";
import type { PoliticalProfileResult } from "@/lib/political-profile";

const QuestionsStep = dynamic(
  () => import("./QuestionsStep").then((m) => m.QuestionsStep),
  { ssr: false },
);
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
  const { update: updateSession } = useSession();
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
  const [profileResult, setProfileResult] = useState<PoliticalProfileResult | null>(null);
  const step: OnboardingStep = funnel.step;
  const [district, setDistrict] = useState(initialDistrict);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [districtNotice, setDistrictNotice] = useState<string | null>(null);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [isSavingManualDistrict, setIsSavingManualDistrict] = useState(false);
  const [savingManualOptionId, setSavingManualOptionId] = useState<string | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState("all");
  const [manualQuery, setManualQuery] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralAutoFilled, setReferralAutoFilled] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("referral_code");
    if (stored) {
      setReferralCode(stored);
      setReferralAutoFilled(true);
    }
  }, []);

  // 온보딩 중 이탈 추적: questions 스텝에서 언마운트되면 abandon 이벤트 발생
  useEffect(() => {
    if (step !== "questions") return;
    const capturedIndex = currentIndex;
    return () => {
      if (capturedIndex < questions.length - 1) {
        import("@vercel/analytics").then(({ track }) => {
          track("onboarding_abandon", { question_index: capturedIndex });
        }).catch(() => undefined);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

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
    void updateSession({ district: result.district });
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
      setSelectedOptionId(null);
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
      setSelectedOptionId(option.id);
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

      const result = (await response.json()) as PoliticalProfileResult;

      void updateSession({ hasPoliticalProfile: true });

      const trimmedCode = referralCode.trim().toUpperCase();
      if (trimmedCode) {
        try {
          const refRes = await fetch("/api/me/referral/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ referralCode: trimmedCode }),
          });
          const refData = await refRes.json() as { ok?: boolean; alreadyUsed?: boolean };
          if (refData.ok && !refData.alreadyUsed) {
            localStorage.setItem("referral_reward_pending", "50");
          }
        } catch {
          // 포인트 지급 실패해도 온보딩은 완료
        }
        localStorage.removeItem("referral_code");
      }

      document.cookie = `${ONBOARDING_SKIP_COOKIE}=; path=/; max-age=0`;
      reset();
      setProfileResult(result);
      setIsSubmitting(false);
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    router.push("/home");
    router.refresh();
  };

  return (
    <Page>
      {isSubmitting ? (
        <FullScreenLoader
          title="결과를 저장하고 있어요"
          description="정치 성향을 분석하고 있습니다."
        />
      ) : null}
      <TopBar>
        <TopBarInner>
          <TopText>정치 성향 테스트</TopText>
          {step === "questions" && !profileResult ? (
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
          {profileResult ? (
            <ResultScreen result={profileResult} onGoHome={handleGoHome} />
          ) : step === "district" ? (
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
                selectedOptionId={selectedOptionId}
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
                referralCode={referralCode}
                referralAutoFilled={referralAutoFilled}
                onReferralCodeChange={setReferralCode}
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
                  지역구 선택은 끝났습니다. 답변을 마치면 결과를 확인할 수 있어요.
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

/* ── ResultScreen ─────────────────────────────────────────── */

type AxisBarProps = {
  label: string;
  score: number;
  leftLabel: string;
  rightLabel: string;
  leftColor: string;
  rightColor: string;
};

function AxisBar({ label, score, leftLabel, rightLabel, leftColor, rightColor }: AxisBarProps) {
  const clampedScore = Math.max(-100, Math.min(100, score));
  const isPositive = clampedScore >= 0;
  const fillPct = Math.abs(clampedScore) / 2;
  const fillColor = isPositive ? rightColor : leftColor;

  return (
    <AxisRow>
      <AxisLabel>{label}</AxisLabel>
      <AxisTrackWrapper>
        <AxisSideLabel $align="left">{leftLabel}</AxisSideLabel>
        <AxisTrack>
          <AxisCenter />
          {clampedScore < 0 && (
            <AxisFill
              $color={fillColor}
              $left={50 - fillPct}
              $width={fillPct}
            />
          )}
          {clampedScore > 0 && (
            <AxisFill
              $color={fillColor}
              $left={50}
              $width={fillPct}
            />
          )}
        </AxisTrack>
        <AxisSideLabel $align="right">{rightLabel}</AxisSideLabel>
      </AxisTrackWrapper>
    </AxisRow>
  );
}

function ResultScreen({
  result,
  onGoHome,
}: {
  result: PoliticalProfileResult;
  onGoHome: () => void;
}) {
  return (
    <ResultWrapper>
      <ResultBadge>분석 완료</ResultBadge>
      <ResultTypeLabel>{result.political_type}</ResultTypeLabel>
      <ResultSubtext>3가지 축으로 분석한 정치 성향이에요.</ResultSubtext>

      <AxisList>
        <AxisBar
          label="경제"
          score={result.economic_score}
          leftLabel="보수"
          rightLabel="진보"
          leftColor="#e5484d"
          rightColor="#3182f6"
        />
        <AxisBar
          label="안보"
          score={result.security_score}
          leftLabel="보수"
          rightLabel="진보"
          leftColor="#e5484d"
          rightColor="#3182f6"
        />
        <AxisBar
          label="사회"
          score={result.social_score}
          leftLabel="보수"
          rightLabel="진보"
          leftColor="#e5484d"
          rightColor="#3182f6"
        />
      </AxisList>

      <GoHomeButton type="button" onClick={onGoHome}>
        홈으로 가기
      </GoHomeButton>
    </ResultWrapper>
  );
}

const ResultWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 8px;
`;

const ResultBadge = styled.div`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  background: #f2f4f6;
  color: #4e5968;
  font-size: 12px;
  font-weight: 600;
  align-self: flex-start;
`;

const ResultTypeLabel = styled.h2`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #191f28;
  line-height: 1.3;
  word-break: keep-all;

  @media (max-width: 640px) {
    font-size: 26px;
  }
`;

const ResultSubtext = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 400;
  color: #6b7684;
`;

const AxisList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 24px 20px;
  border: 1px solid #e5e8eb;
  border-radius: 12px;
  background: #ffffff;
`;

const AxisRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const AxisLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #4e5968;
`;

const AxisTrackWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AxisSideLabel = styled.span<{ $align: "left" | "right" }>`
  font-size: 11px;
  font-weight: 400;
  color: #b0b8c1;
  flex-shrink: 0;
  width: 24px;
  text-align: ${({ $align }) => $align};
`;

const AxisTrack = styled.div`
  position: relative;
  flex: 1;
  height: 8px;
  border-radius: 4px;
  background: #f2f4f6;
  overflow: hidden;
`;

const AxisCenter = styled.div`
  position: absolute;
  left: 50%;
  top: 0;
  width: 1px;
  height: 100%;
  background: #e5e8eb;
  transform: translateX(-50%);
`;

const AxisFill = styled.div<{ $color: string; $left: number; $width: number }>`
  position: absolute;
  top: 0;
  left: ${({ $left }) => $left}%;
  width: ${({ $width }) => $width}%;
  height: 100%;
  background: ${({ $color }) => $color};
  transition: width 400ms cubic-bezier(0.0, 0.0, 0.2, 1);
`;

const GoHomeButton = styled.button`
  width: 100%;
  height: 56px;
  border: 0;
  border-radius: 12px;
  background: #3182f6;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #2272eb;
  }
`;
