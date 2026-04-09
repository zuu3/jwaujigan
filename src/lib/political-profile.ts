import {
  questions,
  type PoliticalAxis,
  type Question,
} from "@/containers/onboarding/questions";

export type PoliticalAnswers = Record<string, number>;

export type PoliticalProfileResult = {
  economic_score: number;
  security_score: number;
  social_score: number;
  political_type: string;
};

const MAX_AXIS_SCORE = 10;
const THRESHOLD = 30;

function normalizeAxisScore(axisQuestions: Question[], answers: PoliticalAnswers) {
  const rawTotal = axisQuestions.reduce((sum, question) => {
    const answer = answers[question.id];
    const safeScore = typeof answer === "number" ? answer : 0;
    const adjustedScore = question.reversed ? safeScore * -1 : safeScore;

    return sum + adjustedScore;
  }, 0);

  return Math.max(-100, Math.min(100, (rawTotal / MAX_AXIS_SCORE) * 100));
}

function getAxisState(score: number) {
  if (score >= THRESHOLD) {
    return "positive";
  }

  if (score <= -THRESHOLD) {
    return "negative";
  }

  return "neutral";
}

function questionsByAxis(axis: PoliticalAxis) {
  return questions.filter((question) => question.axis === axis);
}

function validateAnswers(answers: PoliticalAnswers) {
  const allowedScores = new Set([-2, -1, 0, 1, 2]);

  for (const question of questions) {
    const value = answers[question.id];

    if (typeof value !== "number" || !allowedScores.has(value)) {
      return false;
    }
  }

  return true;
}

export function calculatePoliticalProfile(
  answers: PoliticalAnswers,
): PoliticalProfileResult {
  if (!validateAnswers(answers)) {
    throw new Error("Invalid political profile answers.");
  }

  const economic_score = normalizeAxisScore(questionsByAxis("economic"), answers);
  const security_score = normalizeAxisScore(questionsByAxis("security"), answers);
  const social_score = normalizeAxisScore(questionsByAxis("social"), answers);

  const economicState = getAxisState(economic_score);
  const securityState = getAxisState(security_score);
  const socialState = getAxisState(social_score);

  let political_type = "실용중도파";

  if (
    economicState === "positive" &&
    securityState === "positive" &&
    socialState === "positive"
  ) {
    political_type = "진보개혁파";
  } else if (
    economicState === "negative" &&
    securityState === "negative" &&
    socialState === "negative"
  ) {
    political_type = "보수안정파";
  } else if (
    economicState === "negative" &&
    securityState === "negative" &&
    socialState === "positive"
  ) {
    political_type = "경제보수·사회진보";
  } else if (
    economicState === "positive" &&
    securityState === "neutral" &&
    socialState === "neutral"
  ) {
    political_type = "안보중도·경제진보";
  } else if (
    economicState === "negative" &&
    securityState === "positive" &&
    socialState === "neutral"
  ) {
    political_type = "안보진보·경제보수";
  }

  return {
    economic_score,
    security_score,
    social_score,
    political_type,
  };
}

export function isCompletePoliticalAnswers(answers: PoliticalAnswers) {
  return validateAnswers(answers);
}
