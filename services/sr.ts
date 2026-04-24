import { updateSRSchedule, recordStudy } from './db';

export type StudyResult = 0 | 1 | 2 | 3;

// 0: 몰라요 (Again)
// 1: 헷갈려요 (Hard)
// 2: 알아요 (Good)
// 3: 완벽해요 (Easy)

interface SRState {
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

function computeNextState(current: SRState, result: StudyResult): SRState {
  const { intervalDays, easeFactor, repetitions } = current;

  if (result === 0) {
    return { intervalDays: 1, easeFactor: Math.max(1.3, easeFactor - 0.2), repetitions: 0 };
  }

  if (result === 1) {
    return { intervalDays: Math.max(1, Math.round(intervalDays * 1.2)), easeFactor: Math.max(1.3, easeFactor - 0.15), repetitions: repetitions + 1 };
  }

  let newInterval: number;
  if (repetitions === 0) {
    newInterval = 1;
  } else if (repetitions === 1) {
    newInterval = 3;
  } else {
    newInterval = Math.round(intervalDays * easeFactor);
  }

  let newEaseFactor = easeFactor;
  if (result === 3) {
    newEaseFactor = Math.min(3.0, easeFactor + 0.1);
    newInterval = Math.round(newInterval * 1.3);
  }

  return { intervalDays: newInterval, easeFactor: newEaseFactor, repetitions: repetitions + 1 };
}

function addDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

export async function processStudyResult(
  cardId: number,
  setId: number,
  result: StudyResult,
  currentInterval: number = 1,
  currentEaseFactor: number = 2.5,
  currentRepetitions: number = 0
): Promise<void> {
  const state: SRState = {
    intervalDays: currentInterval,
    easeFactor: currentEaseFactor,
    repetitions: currentRepetitions,
  };

  const next = computeNextState(state, result);
  const nextReviewAt = addDays(next.intervalDays);

  await updateSRSchedule(cardId, nextReviewAt, next.intervalDays, next.easeFactor, next.repetitions);
  await recordStudy(cardId, setId, result);
}

export function getIntervalLabel(intervalDays: number): string {
  if (intervalDays === 1) return '내일';
  if (intervalDays < 7) return `${intervalDays}일 후`;
  if (intervalDays < 30) return `${Math.round(intervalDays / 7)}주 후`;
  if (intervalDays < 365) return `${Math.round(intervalDays / 30)}개월 후`;
  return '1년 이상';
}

export function getPreviewInterval(result: StudyResult, currentInterval: number = 1, currentEaseFactor: number = 2.5, currentRepetitions: number = 0): string {
  const state: SRState = { intervalDays: currentInterval, easeFactor: currentEaseFactor, repetitions: currentRepetitions };
  const next = computeNextState(state, result);
  return getIntervalLabel(next.intervalDays);
}
