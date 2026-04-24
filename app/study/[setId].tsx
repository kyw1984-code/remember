import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { showInterstitialIfReady } from '../../services/adManager';
import { useStudySession } from '../../hooks/useStudySession';
import FlashCard from '../../components/FlashCard';
import ProgressBar from '../../components/ProgressBar';
import { useColors } from '../../hooks/useColors';
import { getPreviewInterval } from '../../services/sr';
import { StudyCardState } from '../../stores/studyStore';

export default function StudyScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { setId, mode } = useLocalSearchParams<{ setId: string; mode?: string }>();
  const { loading, session, initSession, submitResult, endSession, currentCard, progress } = useStudySession();
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    const start = async () => {
      const ok = await initSession(parseInt(setId, 10), mode === 'all' ? 'all' : mode === 'wrong' ? 'wrong' : 'due');
      if (!ok) Alert.alert('알림', '학습할 카드가 없습니다', [{ text: '확인', onPress: () => router.back() }]);
    };
    start();
    return () => endSession();
  }, [setId]);

  useEffect(() => { setIsFlipped(false); setCardKey((k) => k + 1); }, [session?.currentIndex]);

  useEffect(() => {
    if (session?.isComplete) { showInterstitialIfReady(); }
  }, [session?.isComplete]);

  if (loading || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (session.isComplete) {
    const prog = progress();
    const correctRate = prog.total > 0 ? Math.round((prog.correctCount / prog.total) * 100) : 0;
    const studyMode = mode === 'all' ? 'all' : mode === 'wrong' ? 'wrong' : 'due';
    return <CompletionScreen
      total={prog.total}
      correct={prog.correctCount}
      correctRate={correctRate}
      onBack={() => { endSession(); router.back(); }}
      onRetry={async () => {
        const ok = await initSession(parseInt(setId, 10), studyMode);
        if (!ok) Alert.alert('알림', '학습할 카드가 없습니다', [{ text: '확인', onPress: () => { endSession(); router.back(); } }]);
      }}
      styles={styles}
      C={C}
    />;
  }

  const card = currentCard() as StudyCardState | null;
  if (!card) return null;

  const prog = progress();
  const progressVal = prog.total > 0 ? prog.current / prog.total : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert('학습 종료', '학습을 종료할까요?', [{ text: '계속', style: 'cancel' }, { text: '종료', style: 'destructive', onPress: () => { endSession(); router.back(); } }])} style={styles.closeBtn} accessibilityLabel="학습 종료" accessibilityRole="button">
          <Ionicons name="close" size={24} color={C.textSecondary} />
        </TouchableOpacity>
        <View style={styles.progressArea}>
          <ProgressBar progress={progressVal} height={6} />
          <Text style={styles.progressText}>{prog.current + 1} / {prog.total}</Text>
        </View>
      </View>

      <View style={styles.cardArea}>
        <FlashCard key={cardKey} front={card.front} back={card.back} onFlip={setIsFlipped} />
        {!isFlipped && <Text style={styles.flipHint}>카드를 탭해서 답을 확인하세요</Text>}
      </View>

      {isFlipped && (
        <View style={styles.buttons}>
          {([
            { result: 0 as const, label: '몰라요', color: C.danger, bgColor: C.dangerBg },
            { result: 1 as const, label: '헷갈려요', color: C.warning, bgColor: C.warningBg },
            { result: 2 as const, label: '알아요', color: C.success, bgColor: C.successBg },
            { result: 3 as const, label: '완벽해요', color: C.primary, bgColor: C.primaryBg },
          ]).map(({ result, label, color, bgColor }) => (
            <TouchableOpacity key={result} style={[styles.resultBtn, { backgroundColor: bgColor, borderColor: color }]} onPress={() => {
              Haptics.notificationAsync(result >= 2 ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
              submitResult(result);
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

function CompletionScreen({ total, correct, correctRate, onBack, onRetry, styles, C }: {
  total: number; correct: number; correctRate: number; onBack: () => void; onRetry: () => void;
  styles: ReturnType<typeof makeStyles>; C: ReturnType<typeof useColors>;
}) {
  const wrong = total - correct;
  const emoji = correctRate >= 80 ? '🎉' : correctRate >= 60 ? '👍' : '💪';
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.completionContainer}>
        <Text style={styles.completionEmoji}>{emoji}</Text>
        <Text style={styles.completionTitle}>학습 완료!</Text>
        <View style={styles.completionStats}>
          <View style={styles.completionStat}>
            <Text style={styles.completionStatValue}>{total}</Text>
            <Text style={styles.completionStatLabel}>학습 카드</Text>
          </View>
          <View style={styles.completionDivider} />
          <View style={styles.completionStat}>
            <Text style={[styles.completionStatValue, { color: C.success }]}>{correct}</Text>
            <Text style={styles.completionStatLabel}>알아요+</Text>
          </View>
          <View style={styles.completionDivider} />
          <View style={styles.completionStat}>
            <Text style={[styles.completionStatValue, { color: C.danger }]}>{wrong}</Text>
            <Text style={styles.completionStatLabel}>몰라요</Text>
          </View>
          <View style={styles.completionDivider} />
          <View style={styles.completionStat}>
            <Text style={[styles.completionStatValue, { color: C.primary }]}>{correctRate}%</Text>
            <Text style={styles.completionStatLabel}>정답률</Text>
          </View>
        </View>
        <View style={styles.completionBtns}>
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={[styles.doneBtnText, { color: C.primary }]}>다시 학습</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.doneBtn} onPress={onBack}>
            <Text style={styles.doneBtnText}>완료</Text>
          </TouchableOpacity>
        </View>
      </View>
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
    completionBtns: { flexDirection: 'row', gap: 12 },
    retryBtn: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5, borderColor: C.primary, alignItems: 'center' },
    doneBtn: { flex: 1, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, alignItems: 'center', shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
    doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
}
