"use client";

import styled from "@emotion/styled";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Crosshair } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TargetCursor } from "@/components/cursor/target-cursor";
import { ONBOARDING_SKIP_COOKIE } from "@/lib/onboarding";
import { questions, likertOptions } from "./questions";
import { useOnboardingStore } from "./store";

type OnboardingContainerProps = {
  initialDistrict: string | null;
};

type DistrictResponse = {
  district: string;
  province: string | null;
  matchedArea: string | null;
  sourceAddress: string;
};

type GeolocationFailure = {
  code?: number;
  message?: string;
};

function getCurrentPosition(options?: PositionOptions) {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    if (typeof window !== "undefined" && !window.isSecureContext) {
      reject(
        new Error("현재 위치는 HTTPS 또는 localhost에서만 사용할 수 있습니다."),
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
        return "브라우저 위치 권한이 차단되어 있습니다. 주소를 직접 입력하거나 위치 권한을 허용해 주세요.";
      case 2:
        return "현재 위치를 정확히 확인하지 못했습니다. Wi-Fi나 네트워크 상태를 확인해 주세요.";
      case 3:
        return "현재 위치 확인 시간이 초과됐습니다. 다시 시도하거나 주소를 직접 입력해 주세요.";
      default:
        return error.message ?? "현재 위치를 확인하지 못했습니다. 주소를 직접 입력해 주세요.";
    }
  }

  return "현재 위치를 확인하지 못했습니다. 주소를 직접 입력해 주세요.";
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
  const currentIndex = useOnboardingStore((state) => state.currentIndex);
  const answerQuestion = useOnboardingStore((state) => state.answerQuestion);
  const nextQuestion = useOnboardingStore((state) => state.nextQuestion);
  const reset = useOnboardingStore((state) => state.reset);
  const answers = useOnboardingStore((state) => state.answers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [district, setDistrict] = useState(initialDistrict);
  const [address, setAddress] = useState("");
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const [districtError, setDistrictError] = useState<string | null>(null);
  const [districtNotice, setDistrictNotice] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);

  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;
  const isResolvingDistrict = isResolvingAddress || isResolvingLocation;
  const canAnswer = Boolean(district) && !isSubmitting && !isResolvingDistrict;
  const currentSelection = useMemo(
    () => answers[question.id],
    [answers, question.id],
  );

  const handleSkip = () => {
    document.cookie = `${ONBOARDING_SKIP_COOKIE}=true; path=/; max-age=604800`;
    reset();
    router.push("/home?skip=true");
  };

  const saveDistrict = async (payload: {
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => {
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
    setDistrictError(null);
    setDistrictNotice(
      result.matchedArea
        ? `${result.matchedArea} 기준으로 지역구를 찾았습니다.`
        : "지역구를 찾았습니다.",
    );
    router.refresh();
  };

  const handleResolveAddress = async () => {
    const trimmed = address.trim();

    if (!trimmed) {
      setDistrictError("시/군/구와 읍/면/동까지 포함해서 입력해 주세요.");
      return;
    }

    setIsResolvingAddress(true);
    setDistrictError(null);
    setDistrictNotice(null);

    try {
      await saveDistrict({ address: trimmed });
    } catch (error) {
      console.error(error);
      setDistrictError(
        error instanceof Error
          ? error.message
          : "주소로 지역구를 찾지 못했습니다.",
      );
    } finally {
      setIsResolvingAddress(false);
    }
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
    } catch (error) {
      console.error(error);
      setDistrictError(getLocationErrorMessage(error));
    } finally {
      setIsResolvingLocation(false);
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
      <TopBar>
        <TopBarInner>
          <TopText>정치 성향 테스트</TopText>
          <SkipButton type="button" onClick={handleSkip}>
            건너뛰기
          </SkipButton>
        </TopBarInner>
      </TopBar>

      <Content>
        <ContentInner>
          <DistrictSection>
            <DistrictMeta>
              <DistrictEyebrow>내 지역부터 설정</DistrictEyebrow>
              <DistrictTitle>위치나 주소로 지역구를 먼저 정해 주세요</DistrictTitle>
              <DistrictDescription>
                주소는 시/군/구와 읍/면/동까지 입력하면 가장 정확합니다.
              </DistrictDescription>
            </DistrictMeta>

            <DistrictPanel>
              <DistrictStatus>
                <StatusLabel>현재 지역구</StatusLabel>
                <StatusValue>{district ?? "아직 설정되지 않았습니다"}</StatusValue>
                {resolvedAddress ? (
                  <StatusHint>{resolvedAddress}</StatusHint>
                ) : initialDistrict ? (
                  <StatusHint>이미 저장된 지역구를 사용합니다.</StatusHint>
                ) : null}
              </DistrictStatus>

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

              <AddressRow>
                <AddressInput
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="예: 서울 마포구 서교동"
                  disabled={isResolvingDistrict}
                />
                <AddressButton
                  type="button"
                  onClick={() => void handleResolveAddress()}
                  disabled={isResolvingDistrict}
                >
                  {isResolvingAddress ? "찾는 중" : "주소로 찾기"}
                </AddressButton>
              </AddressRow>

              {districtNotice ? <HelperText>{districtNotice}</HelperText> : null}
              {districtError ? <ErrorText>{districtError}</ErrorText> : null}
            </DistrictPanel>
          </DistrictSection>

          <Header>
            <ProgressMeta>
              <ProgressText>
                {currentIndex + 1}/{questions.length}
              </ProgressText>
              <ProgressTitle>정치 이슈에 대한 생각을 알려주세요</ProgressTitle>
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

          {!district ? (
            <BottomHint>
              지역구를 설정해야 테스트 결과를 저장하고 홈으로 이동할 수 있습니다.
            </BottomHint>
          ) : null}
        </ContentInner>
      </Content>
      <TargetCursor targetSelector='[data-cursor-target="onboarding-answer"]' />
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  color: #191f28;
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
  color: #6b7684;
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: -0.02em;
`;

const SkipButton = styled.button`
  padding: 10px 14px;
  border: 0;
  border-radius: 999px;
  color: #4e5968;
  background: rgba(49, 130, 246, 0.08);
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
`;

const Content = styled.section`
  display: flex;
  justify-content: center;
  padding: 36px 24px 64px;

  @media (max-width: 640px) {
    padding: 28px 20px 48px;
  }
`;

const ContentInner = styled.div`
  width: min(100%, 960px);
`;

const DistrictSection = styled.section`
  display: grid;
  gap: 16px;
  margin-bottom: 32px;
  padding: 24px;
  border-radius: 32px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.06);

  @media (max-width: 640px) {
    padding: 20px;
    border-radius: 24px;
  }
`;

const DistrictMeta = styled.div`
  display: grid;
  gap: 8px;
`;

const DistrictEyebrow = styled.div`
  color: #3182f6;
  font-size: 0.84rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const DistrictTitle = styled.h2`
  margin: 0;
  font-size: clamp(1.5rem, 3vw, 2rem);
  font-weight: 800;
  line-height: 1.28;
  letter-spacing: -0.05em;
  word-break: keep-all;
`;

const DistrictDescription = styled.p`
  margin: 0;
  color: #6b7684;
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
  padding: 18px 20px;
  border-radius: 22px;
  background: #f4f8ff;
`;

const StatusLabel = styled.div`
  color: #6b7684;
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
  color: #6b7684;
  font-size: 0.92rem;
  line-height: 1.5;
`;

const LocationButton = styled.button`
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border: 0;
  border-radius: 999px;
  color: #1d4ed8;
  background: rgba(49, 130, 246, 0.1);
  font-size: 0.94rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 640px) {
    width: 100%;
    justify-content: center;
  }
`;

const AddressRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const AddressInput = styled.input`
  width: 100%;
  min-height: 54px;
  padding: 0 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  color: #191f28;
  background: #ffffff;
  font-size: 0.96rem;

  &::placeholder {
    color: #8b95a1;
  }
`;

const AddressButton = styled.button`
  min-height: 54px;
  padding: 0 18px;
  border: 0;
  border-radius: 18px;
  color: #ffffff;
  background: #3182f6;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const HelperText = styled.div`
  color: #1d4ed8;
  font-size: 0.92rem;
  font-weight: 600;
`;

const ErrorText = styled.div`
  color: #e11d48;
  font-size: 0.92rem;
  font-weight: 600;
`;

const Header = styled.div`
  max-width: 720px;
`;

const ProgressMeta = styled.div`
  display: grid;
  gap: 10px;
`;

const ProgressText = styled.div`
  color: #3182f6;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: -0.02em;
`;

const ProgressTitle = styled.h1`
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.18;
  letter-spacing: -0.06em;
  word-break: keep-all;
  text-wrap: balance;
`;

const ProgressBar = styled.div`
  height: 8px;
  margin-top: 24px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #3182f6 0%, #5ba4ff 100%);
  transition: width 220ms ease;
`;

const QuestionStage = styled.div`
  margin-top: 28px;
`;

const QuestionCard = styled(motion.div)`
  min-height: 250px;
  padding: 30px;
  border-radius: 32px;
  background: #ffffff;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);

  @media (max-width: 640px) {
    min-height: 220px;
    padding: 22px;
    border-radius: 24px;
  }
`;

const QuestionEyebrow = styled.div`
  color: #3182f6;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
`;

const QuestionText = styled.p`
  margin: 18px 0 0;
  font-size: clamp(1.55rem, 3vw, 2.15rem);
  font-weight: 700;
  line-height: 1.45;
  letter-spacing: -0.04em;
  word-break: keep-all;
  text-wrap: pretty;
`;

const AnswerGrid = styled.div`
  display: grid;
  margin-top: 22px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const AnswerButton = styled.button<{ $selected: boolean }>`
  display: flex;
  min-height: 64px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid
    ${({ $selected }) => ($selected ? "rgba(49, 130, 246, 0.36)" : "transparent")};
  border-radius: 18px;
  color: ${({ $selected }) => ($selected ? "#1d4ed8" : "#191f28")};
  background: ${({ $selected }) =>
    $selected ? "rgba(49, 130, 246, 0.08)" : "rgba(255, 255, 255, 0.9)"};
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
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
  }

  @media (max-width: 960px) {
    min-height: 58px;
  }
`;

const BottomHint = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  color: #6b7684;
  font-size: 0.92rem;
  font-weight: 600;

  &::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: #9aa4b2;
  }
`;
