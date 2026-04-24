import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { showInterstitialIfReady } from '../../services/adManager';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDueCards, getSRSchedule } from '../../services/db';
import { processStudyResult, getPreviewInterval, StudyResult } from '../../services/sr';
import FlashCard from '../../components/FlashCard';
import ProgressBar from '../../components/ProgressBar';
import { useColors } from '../../hooks/useColors';

interface ReviewCard {
  id: number;
  set_id: number;
  front: string;
  back: string;
  set_name: string;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
}

export default function ReviewScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [current, setCurrent] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<number[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => { loadCards(); }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const dueCards = await getDueCards();
      const reviewCards: ReviewCard[] = await Promise.all(
        dueCards.map(async (c) => {
          const sr = await getSRSchedule(c.id);
          return { ...c, intervalDays: sr?.interval_days ?? 1, easeFactor: sr?.ease_factor ?? 2.5, repetitions: sr?.repetitions ?? 0 };
        })
      );
      setCards(reviewCards);
    } catch {
      Alert.alert('오류', '카드를 불러오는 데 실패했습니다.', [{ text: '확인', onPress: () => router.back() }]);
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (result: StudyResult) => {
    const card = cards[current];
    if (!card) return;
    try {
      await processStudyResult(card.id, card.set_id, result, card.intervalDays, card.easeFactor, card.repetitions);
    } catch {
      // SR 업데이트 실패해도 학습 흐름은 유지
    }
    setResults((r) => [...r, result]);
    const nextIdx = current + 1;
    if (nextIdx >= cards.length) { setIsComplete(true); showInterstitialIfReady(); } else { setCurrent(nextIdx); setIsFlipped(false); setCardKey((k) => k + 1); }
  };

  const handleClose = () => {
    Alert.alert('복습 종료', '복습을 종료할까요?', [
      { text: '계속', style: 'cancel' },
      { text: '종료', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && cards.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>오늘 복습할 카드가 없습니다</Text>
          <Text style={styles.emptyDesc}>모든 카드를 잘 학습했어요!</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>홈으로</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isComplete) {
    const correctCount = results.filter((r) => r >= 2).length;
    const wrongCount = results.length - correctCount;
    const correctRate = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.completionContainer}>
          <Text style={styles.completionEmoji}>{correctRate >= 80 ? '🎉' : correctRate >= 60 ? '👍' : '💪'}</Text>
          <Text style={styles.completionTitle}>복습 완료!</Text>
          <View style={styles.completionStats}>
            <View style={styles.completionStat}>
              <Text style={styles.completionStatValue}>{cards.length}</Text>
              <Text style={styles.completionStatLabel}>복습 카드</Text>
            </View>
            <View style={styles.completionDivider} />
            <View style={styles.completionStat}>
              <Text style={[styles.completionStatValue, { color: C.success }]}>{correctCount}</Text>
              <Text style={styles.completionStatLabel}>알아요+</Text>
            </View>
            <View style={styles.completionDivider} />
            <View style={styles.completionStat}>
              <Text style={[styles.completionStatValue, { color: C.danger }]}>{wrongCount}</Text>
              <Text style={styles.completionStatLabel}>몰라요</Text>
            </View>
            <View style={styles.completionDivider} />
            <View style={styles.completionStat}>
              <Text style={[styles.completionStatValue, { color: C.primary }]}>{correctRate}%</Text>
              <Text style={styles.completionStatLabel}>정답률</Text>
            </View>
          </View>
          <View style={styles.completionBtns}>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setIsComplete(false); setCurrent(0); setResults([]); setCardKey((k) => k + 1); loadCards(); }}>
              <Text style={[styles.doneBtnText, { color: C.primary }]}>다시 복습</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
              <Text style={styles.doneBtnText}>홈으로</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[current];
  if (!card) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="복습 종료" accessibilityRole="button">
          <Ionicons name="close" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressArea}>
          <ProgressBar progress={(current + 1) / cards.length} height={6} />
          <Text style={styles.progressText}>{current + 1} / {cards.length}</Text>
        </View>
      </View>

      <Text style={styles.setLabel}>{card.set_name}</Text>

      <View style={styles.cardArea}>
        <FlashCard key={cardKey} front={card.front} back={card.back} onFlip={setIsFlipped} />
        {!isFlipped && <Text style={styles.flipHint}>탭하여 답 확인</Text>}
      </View>

      {isFlipped && (
        <View style={styles.buttons}>
          {([
            { result: 0 as StudyResult, label: '몰라요', color: C.danger, bgColor: C.dangerBg },
            { result: 1 as StudyResult, label: '헷갈려요', color: C.warning, bgColor: C.warningBg },
            { result: 2 as StudyResult, label: '알아요', color: C.success, bgColor: C.successBg },
            { result: 3 as StudyResult, label: '완벽해요', color: C.primary, bgColor: C.primaryBg },
          ]).map(({ result, label, color, bgColor }) => (
            <TouchableOpacity key={result} style={[styles.resultBtn, { backgroundColor: bgColor, borderColor: color }]} onPress={() => {
              Haptics.notificationAsync(result >= 2 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
              handleResult(result);
            }} activeOpacity={0.8}>
              <Text style={[styles.resultBtnLabel, { color }]}>{label}</Text>
              <Text style={[styles.resultBtnInterval, { color }]}>{getPreviewInterval(result, card.intervalDays, card.easeFactor, card.repetitions)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
    closeBtn: { padding: 4 },
    progressArea: { flex: 1, gap: 6 },
    progressText: { fontSize: 12, color: C.textMuted, textAlign: 'right' },
    setLabel: { textAlign: 'center', fontSize: 13, color: C.textSecondary, marginBottom: 4, fontWeight: '600' },
    cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
    flipHint: { fontSize: 14, color: C.textMuted },
    buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 16, paddingBottom: 24 },
    resultBtn: { flex: 1, minWidth: '45%', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
    resultBtnLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
    resultBtnInterval: { fontSize: 11, opacity: 0.8 },
    completionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    completionEmoji: { fontSize: 64, marginBottom: 16 },
    completionTitle: { fontSize: 28, fontWeight: '800', color: C.text, marginBottom: 32 },
    completionStats: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 20, padding: 24, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 4 },
    completionStat: { flex: 1, alignItems: 'center' },
    completionStatValue: { fontSize: 28, fontWeight: '800', color: C.text },
    completionStatLabel: { fontSize: 12, color: C.textMuted, marginTop: 4 },
    completionDivider: { width: 1, backgroundColor: C.border, marginHorizontal: 8 },
    emptyEmoji: { fontSize: 56, marginBottom: 16 },
    emptyTitle: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 8, textAlign: 'center' },
    emptyDesc: { fontSize: 14, color: C.textMuted, marginBottom: 32, textAlign: 'center' },
    completionBtns: { flexDirection: 'row', gap: 12 },
    retryBtn: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: C.primary, alignItems: 'center' },
    doneBtn: { flex: 1, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
}
