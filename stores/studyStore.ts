import { create } from 'zustand';
import { Card } from '../services/db';

export interface StudyCardState extends Card {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

interface StudySession {
  setId: number;
  setName: string;
  cards: StudyCardState[];
  currentIndex: number;
  results: number[];
  isComplete: boolean;
}

interface StudyStore {
  session: StudySession | null;
  startSession: (setId: number, setName: string, cards: StudyCardState[]) => void;
  recordResult: (result: number) => void;
  nextCard: () => void;
  endSession: () => void;
  currentCard: () => StudyCardState | null;
  progress: () => { current: number; total: number; correctCount: number };
}

export const useStudyStore = create<StudyStore>()((set, get) => ({
  session: null,

  startSession: (setId, setName, cards) =>
    set({
      session: {
        setId,
        setName,
        cards,
        currentIndex: 0,
        results: [],
        isComplete: false,
      },
    }),

  recordResult: (result) => {
    const { session } = get();
    if (!session) return;
    set({
      session: {
        ...session,
        results: [...session.results, result],
      },
    });
  },

  nextCard: () => {
    const { session } = get();
    if (!session) return;
    const nextIndex = session.currentIndex + 1;
    set({
      session: {
        ...session,
        currentIndex: nextIndex,
        isComplete: nextIndex >= session.cards.length,
      },
    });
  },

  endSession: () => set({ session: null }),

  currentCard: () => {
    const { session } = get();
    if (!session) return null;
    return session.cards[session.currentIndex] ?? null;
  },

  progress: () => {
    const { session } = get();
    if (!session) return { current: 0, total: 0, correctCount: 0 };
    const correctCount = session.results.filter((r) => r >= 2).length;
    return {
      current: session.currentIndex,
      total: session.cards.length,
      correctCount,
    };
  },
}));
