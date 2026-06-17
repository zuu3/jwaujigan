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

const THRESHOLD = 40;

function normalizeAxisScore(axisQuestions: Question[], answers: PoliticalAnswers) {
  const maxScore = axisQuestions.length * 2;
  const rawTotal = axisQuestions.reduce((sum, question) => {
    const answer = answers[question.id];
    const safeScore = typeof answer === "number" ? answer : 0;
    const adjustedScore = question.reversed ? safeScore * -1 : safeScore;

    return sum + adjustedScore;
  }, 0);

  return Math.max(-100, Math.min(100, (rawTotal / maxScore) * 100));
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

  // 경제(e)/안보(s)/사회(c) 각 축: p=positive, n=neutral, g=negative
  const stateKey = (state: ReturnType<typeof getAxisState>) =>
    state === "positive" ? "p" : state === "negative" ? "g" : "n";

  const key = `${stateKey(economicState)}${stateKey(securityState)}${stateKey(socialState)}`;

  const typeMap: Record<string, string> = {
    ppp: "진보개혁파", ppn: "진보성장파", ppg: "진보성장파",
    pnp: "진보성장파", pnn: "경제민주파", png: "경제민주파",
    pgp: "진보성장파", pgn: "경제민주파", pgg: "경제민주파",
    npp: "사회진보파", npn: "안보현실파", npg: "안보현실파",
    nnp: "사회진보파", nnn: "실용중도파", nng: "전통보수파",
    ngp: "사회진보파", ngn: "안보현실파", ngg: "전통보수파",
    gpp: "사회진보파", gpn: "안보현실파", gpg: "전통보수파",
    gnp: "사회진보파", gnn: "경제보수파", gng: "전통보수파",
    ggp: "경제보수파", ggn: "보수안정파", ggg: "보수안정파",
  };

  const political_type = typeMap[key] ?? "실용중도파";

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
