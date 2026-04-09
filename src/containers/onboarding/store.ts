import { create } from "zustand";
import { questions } from "./questions";

type AnswersMap = Record<string, number>;

type OnboardingStore = {
  currentIndex: number;
  answers: AnswersMap;
  answerQuestion: (questionId: string, score: number) => AnswersMap;
  nextQuestion: () => void;
  reset: () => void;
};

const initialState = {
  currentIndex: 0,
  answers: {},
};

export const useOnboardingStore = create<OnboardingStore>((set, get) => ({
  ...initialState,
  answerQuestion: (questionId, score) => {
    const nextAnswers = {
      ...get().answers,
      [questionId]: score,
    };

    set({ answers: nextAnswers });

    return nextAnswers;
  },
  nextQuestion: () => {
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, questions.length - 1),
    }));
  },
  reset: () => {
    set(initialState);
  },
}));
