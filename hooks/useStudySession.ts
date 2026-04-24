import { useState, useCallback } from 'react';
import { getCards, getCardSet, getSRSchedule, getDueCardsForSet, getWrongCards } from '../services/db';
import { processStudyResult, StudyResult } from '../services/sr';
import { useStudyStore, StudyCardState } from '../stores/studyStore';

export function useStudySession() {
  const [loading, setLoading] = useState(false);
  const { session, startSession, recordResult, nextCard, endSession, currentCard, progress } = useStudyStore();

  const initSession = useCallback(async (setId: number, mode: 'all' | 'due' | 'wrong' = 'due') => {
    setLoading(true);
    try {
      const cardSet = await getCardSet(setId);
      if (!cardSet) return false;

      let cards;
      if (mode === 'wrong') {
        cards = await getWrongCards(setId);
      } else if (mode === 'due') {
        cards = await getDueCardsForSet(setId);
        if (cards.length === 0) {
          cards = await getCards(setId);
        }
      } else {
        cards = await getCards(setId);
      }

      if (cards.length === 0) return false;

      const studyCards: StudyCardState[] = await Promise.all(
        cards.map(async (card) => {
          const sr = await getSRSchedule(card.id);
          return {
            ...card,
            intervalDays: sr?.interval_days ?? 1,
            easeFactor: sr?.ease_factor ?? 2.5,
            repetitions: sr?.repetitions ?? 0,
          };
        })
      );

      startSession(setId, cardSet.name, studyCards);
      return true;
    } finally {
      setLoading(false);
    }
  }, [startSession]);

  const submitResult = useCallback(async (result: StudyResult) => {
    const card = currentCard();
    if (!card || !session) return;

    recordResult(result);
    await processStudyResult(
      card.id,
      session.setId,
      result,
      card.intervalDays,
      card.easeFactor,
      card.repetitions
    );
    nextCard();
  }, [session, currentCard, recordResult, nextCard]);

  return {
    loading,
    session,
    initSession,
    submitResult,
    endSession,
    currentCard,
    progress,
  };
}
