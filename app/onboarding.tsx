import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '../hooks/useColors';
import { storageSet } from '../services/storage';

const { width } = Dimensions.get('window');

const STEPS = [
  {
    emoji: '🃏',
    title: '플래시카드로\n스마트하게 암기',
    desc: '앞면을 보고 답을 떠올린 뒤\n카드를 탭해서 정답을 확인하세요',
  },
  {
    emoji: '🧠',
    title: '간격 반복으로\n기억 효율 극대화',
    desc: '알아요 / 완벽해요를 선택하면\n다음 복습까지 간격이 자동으로 늘어납니다',
  },
  {
    emoji: '📊',
    title: '오답을 집중 공략',
    desc: '틀린 카드는 오답 노트에 자동 저장되어\n취약 부분만 모아 복습할 수 있습니다',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;

  const finish = async () => {
    await storageSet('onboarded', 'true');
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (isLast) { finish(); } else { setStep((s) => s + 1); }
  };

  const current = STEPS[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.skipBtn} onPress={finish}>
          <Text style={styles.skipText}>건너뛰기</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.emoji}>{current.emoji}</Text>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.desc}>{current.desc}</Text>
        </View>

        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.nextBtnText}>{isLast ? '시작하기' : '다음'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    container: { flex: 1, paddingHorizontal: 32, paddingBottom: 40 },
    skipBtn: { alignSelf: 'flex-end', paddingVertical: 12, paddingLeft: 16 },
    skipText: { fontSize: 15, color: C.textMuted, fontWeight: '500' },
    content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emoji: { fontSize: 80, marginBottom: 32 },
    title: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', lineHeight: 36, marginBottom: 16 },
    desc: { fontSize: 16, color: C.textSecondary, textAlign: 'center', lineHeight: 26 },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
    dotActive: { width: 24, backgroundColor: C.primary },
    nextBtn: {
      backgroundColor: C.primary,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    nextBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  });
}
