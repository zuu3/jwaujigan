import styled from "@emotion/styled";
import Link from "next/link";
import type { Session } from "next-auth";
import { SignOutButton } from "@/components/auth/sign-out-button";

type HomeContainerProps = {
  session: Session;
  profile: {
    economic_score: number;
    security_score: number;
    social_score: number;
    political_type: string;
    updated_at?: string | null;
  } | null;
  canSkipOnboarding: boolean;
};

export function HomeContainer({
  session,
  profile,
  canSkipOnboarding,
}: HomeContainerProps) {
  return (
    <Page>
      <Header>
        <Brand>좌우지간</Brand>
        <HeaderActions>
          <BackLink href="/">랜딩으로</BackLink>
          <SignOutButton />
        </HeaderActions>
      </Header>

      <Main>
        <Eyebrow>
          {session.user.name ? `${session.user.name}님 환영합니다` : "환영합니다"}
        </Eyebrow>
        <Title>정치 리터러시 홈</Title>
        <Description>
          내 지역 정치인 탐색과 이슈 비교를 시작할 수 있는 기본 홈 화면입니다.
        </Description>

        <Grid>
          <PrimaryCard>
            <CardLabel>내 상태</CardLabel>
            <CardTitle>
              {profile ? profile.political_type : "정치 성향 테스트가 아직 없습니다"}
            </CardTitle>
            <CardText>
              {profile
                ? "결과를 바탕으로 이후 추천 경험을 확장할 수 있습니다."
                : canSkipOnboarding
                  ? "지금은 건너뛴 상태입니다. 원할 때 테스트를 다시 진행할 수 있습니다."
                  : "정치 성향 테스트를 완료하면 더 개인화된 경험을 제공할 수 있습니다."}
            </CardText>

            <MetricRow>
              <MetricCard>
                <MetricLabel>지역구</MetricLabel>
                <MetricValue>{session.user.district ?? "미설정"}</MetricValue>
              </MetricCard>
              <MetricCard>
                <MetricLabel>이메일</MetricLabel>
                <MetricValue>{session.user.email ?? "-"}</MetricValue>
              </MetricCard>
            </MetricRow>
          </PrimaryCard>

          <SecondaryCard>
            <CardLabel>다음 단계</CardLabel>
            <ActionList>
              <ActionItem href="/onboarding">
                정치 성향 테스트 {profile ? "다시" : ""}하기
              </ActionItem>
              <ActionItem href="/#local-info">우리 동네 정치인 살펴보기</ActionItem>
              <ActionItem href="/#arena">AI 아레나 프리뷰 보기</ActionItem>
            </ActionList>
          </SecondaryCard>
        </Grid>

        {profile ? (
          <ResultRow>
            <ResultCard>
              <MetricLabel>경제</MetricLabel>
              <ResultValue>{profile.economic_score}</ResultValue>
            </ResultCard>
            <ResultCard>
              <MetricLabel>안보/외교</MetricLabel>
              <ResultValue>{profile.security_score}</ResultValue>
            </ResultCard>
            <ResultCard>
              <MetricLabel>사회</MetricLabel>
              <ResultValue>{profile.social_score}</ResultValue>
            </ResultCard>
          </ResultRow>
        ) : null}
      </Main>
    </Page>
  );
}

const Page = styled.main`
  min-height: 100vh;
  padding: 28px 24px 64px;
  color: #191f28;
  background: #f8fbff;

  @media (max-width: 640px) {
    padding: 20px 20px 48px;
  }
`;

const Header = styled.header`
  display: flex;
  width: min(100%, 1120px);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 0 auto;
`;

const Brand = styled.div`
  font-size: 1.02rem;
  font-weight: 800;
  letter-spacing: -0.04em;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BackLink = styled(Link)`
  color: #4e5968;
  font-size: 0.92rem;
  font-weight: 700;
`;

const Main = styled.section`
  width: min(100%, 1120px);
  margin: 36px auto 0;
`;

const Eyebrow = styled.div`
  color: #3182f6;
  font-size: 0.92rem;
  font-weight: 700;
`;

const Title = styled.h1`
  margin: 14px 0 0;
  font-size: clamp(2rem, 5vw, 3.4rem);
  font-weight: 800;
  line-height: 1.14;
  letter-spacing: -0.06em;
  word-break: keep-all;
`;

const Description = styled.p`
  max-width: 680px;
  margin: 18px 0 0;
  color: #6b7684;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.7;
  word-break: keep-all;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(280px, 360px);
  gap: 16px;
  margin-top: 28px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const CardBase = styled.div`
  padding: 28px;
  border-radius: 28px;
  background: #ffffff;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.06);

  @media (max-width: 640px) {
    padding: 22px;
    border-radius: 22px;
  }
`;

const PrimaryCard = styled(CardBase)``;

const SecondaryCard = styled(CardBase)`
  background: #f2f7ff;
`;

const CardLabel = styled.div`
  color: #3182f6;
  font-size: 0.84rem;
  font-weight: 700;
`;

const CardTitle = styled.h2`
  margin: 10px 0 0;
  font-size: 1.55rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -0.04em;
  word-break: keep-all;
`;

const CardText = styled.p`
  margin: 12px 0 0;
  color: #6b7684;
  font-size: 0.96rem;
  font-weight: 500;
  line-height: 1.6;
  word-break: keep-all;
`;

const MetricRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 20px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  padding: 16px 18px;
  border-radius: 18px;
  background: #f8fafc;
`;

const MetricLabel = styled.div`
  color: #6b7684;
  font-size: 0.82rem;
  font-weight: 700;
`;

const MetricValue = styled.div`
  margin-top: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.5;
  word-break: break-word;
`;

const ActionList = styled.div`
  display: grid;
  gap: 10px;
  margin-top: 18px;
`;

const ActionItem = styled(Link)`
  display: flex;
  min-height: 54px;
  align-items: center;
  padding: 0 18px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.78);
  color: #191f28;
  font-size: 0.95rem;
  font-weight: 700;
`;

const ResultRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-top: 20px;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ResultCard = styled.div`
  padding: 22px 24px;
  border-radius: 24px;
  background: #ffffff;
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.05);
`;

const ResultValue = styled.div`
  margin-top: 10px;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.05em;
`;
