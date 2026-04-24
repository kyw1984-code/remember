import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import BannerAdView from '../../components/BannerAdView';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getDueCardCount, getStudyStats, StudyStats } from '../../services/db';
import { useColors } from '../../hooks/useColors';
import ProgressBar from '../../components/ProgressBar';
import { useSettingsStore } from '../../stores/settingsStore';

export default function HomeScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { dailyGoal } = useSettingsStore();
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, dc] = await Promise.all([getStudyStats(), getDueCardCount()]);
      setStats(s);
      setDueCount(dc);
    } finally {
      setLoading(false);
    }
  };

  const goalProgress = stats ? Math.min(1, stats.today_studied / dailyGoal) : 0;
  const today = new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <BannerAdView />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>안녕하세요 👋</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={styles.streakText}>{stats?.streak ?? 0}일</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.reviewCard, dueCount === 0 && styles.reviewCardEmpty]}
          onPress={() => dueCount > 0 && router.push('/study/review')}
          activeOpacity={0.85}
        >
          <View>
            <Text style={styles.reviewTitle}>오늘의 복습</Text>
            {dueCount > 0 ? (
              <>
                <Text style={styles.reviewCount}>{dueCount}장 대기 중</Text>
                <Text style={styles.reviewSub}>지금 바로 시작해보세요!</Text>
              </>
            ) : (
              <>
                <Text style={styles.reviewCount}>완료 🎉</Text>
                <Text style={styles.reviewSub}>오늘 복습할 카드가 없습니다</Text>
              </>
            )}
          </View>
          {dueCount > 0 && (
            <View style={styles.reviewBtn}>
              <Ionicons name="play" size={20} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>오늘의 목표</Text>
            <Text style={styles.sectionSub}>{stats?.today_studied ?? 0} / {dailyGoal}장</Text>
          </View>
          <ProgressBar progress={goalProgress} />
          {goalProgress >= 1 && <Text style={styles.goalDone}>🎯 목표 달성!</Text>}
        </View>

        <View style={styles.statsGrid}>
          <StatItem icon="layers" value={stats?.total_cards ?? 0} label="전체 카드" color={C.primary} styles={styles} />
          <StatItem icon="checkmark-circle" value={stats?.mastered_cards ?? 0} label="완성" color={C.success} styles={styles} />
          <StatItem icon="time" value={stats?.learning_cards ?? 0} label="학습 중" color={C.warning} styles={styles} />
          <StatItem icon="add-circle" value={stats?.new_cards ?? 0} label="새 카드" color={C.danger} styles={styles} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 시작</Text>
          <View style={styles.quickActions}>
            <QuickAction icon="add-circle" label="세트 만들기" color={C.primary} onPress={() => router.push('/sets/create')} styles={styles} />
            <QuickAction icon="book" label="프리셋 추가" color={C.success} onPress={() => router.push('/sets/presets')} styles={styles} />
            <QuickAction icon="warning" label="오답 노트" color={C.warning} onPress={() => router.push('/sets/wrong')} styles={styles} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ icon, value, label, color, styles }: { icon: string; value: number; label: string; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as 'layers'} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress, styles }: { icon: string; label: string; color: string; onPress: () => void; styles: ReturnType<typeof makeStyles> }) {
  return (
    <TouchableOpacity style={styles.qaItem} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.qaIcon, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon as 'add-circle'} size={24} color={color} />
      </View>
      <Text style={styles.qaLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    greeting: { fontSize: 22, fontWeight: '700', color: C.text },
    date: { fontSize: 14, color: C.textSecondary, marginTop: 2 },
    streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.streakBg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, gap: 4 },
    streakIcon: { fontSize: 16 },
    streakText: { fontSize: 14, fontWeight: '700', color: C.streakAccent },
    reviewCard: {
      backgroundColor: C.primary,
      borderRadius: 20,
      padding: 24,
      marginBottom: 24,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      shadowColor: C.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    reviewCardEmpty: { backgroundColor: C.success, shadowColor: C.success },
    reviewTitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 4 },
    reviewCount: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
    reviewSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
    reviewBtn: { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: C.text, marginBottom: 12 },
    sectionSub: { fontSize: 14, color: C.textSecondary },
    goalDone: { marginTop: 8, fontSize: 14, color: C.success, fontWeight: '600' },
    statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
    statItem: { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    statValue: { fontSize: 20, fontWeight: '800', color: C.text },
    statLabel: { fontSize: 11, color: C.textSecondary, marginTop: 2 },
    quickActions: { flexDirection: 'row', gap: 10 },
    qaItem: { flex: 1, alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
    qaIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    qaLabel: { fontSize: 12, fontWeight: '600', color: C.text, textAlign: 'center' },
  });
}
