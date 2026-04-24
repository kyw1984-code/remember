export interface PresetMeta {
  id: string;
  name: string;
  description: string;
  category: string;
  cardCount: number;
  emoji: string;
}

export const PRESETS: PresetMeta[] = [
  { id: 'suneung_english', name: '수능 필수 영단어', description: '수능 필수 영단어 400선', category: '영어', cardCount: 400, emoji: '📚' },
  { id: 'toeic_words', name: '토익 빈출 단어', description: '토익 고빈출 단어 200선', category: '영어', cardCount: 200, emoji: '🎯' },
  { id: 'korean_history', name: '공무원 한국사 연표', description: '공무원 시험 핵심 한국사 사건', category: '한국사', cardCount: 100, emoji: '🏛️' },
  { id: 'korean_history_exam', name: '한국사능력검정 심화', description: '한국사능력검정 심화 핵심 개념', category: '한국사', cardCount: 100, emoji: '📜' },
  { id: 'info_processing', name: '정보처리기사 핵심', description: '정보처리기사 핵심 용어', category: 'IT', cardCount: 80, emoji: '💻' },
  { id: 'hanja', name: '한자능력검정 4급', description: '한자능력검정 4급 한자', category: '한자', cardCount: 100, emoji: '🀄' },
  { id: 'idioms', name: '사자성어 200선', description: '자주 쓰이는 사자성어', category: '국어', cardCount: 50, emoji: '🎋' },
];
