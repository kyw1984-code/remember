import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getStudyStats, getWeeklyStats, StudyStats } from '../../services/db';
import { useColors } from '../../hooks/useColors';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function StatsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [stats, setStats] = useState<StudyStats | null>(null);
  const [weekly, setWeekly] = useState<Array<{ date: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const loadStats = async () => {
    setLoading(true);
    try {
      const [s, w] = await Promise.all([getStudyStats(), getWeeklyStats()]);
      setStats(s);
      setWeekly(w);
    } finally {
      setLoading(false);
    }
  };

  const maxCount = Math.max(...weekly.map((w) => w.count), 1);

  const getLast7Days = () => {
    const days: Array<{ date: string; label: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = weekly.find((w) => w.date === dateStr);
      days.push({ date: dateStr, label: DAY_LABELS[d.getDay()], count: found?.count ?? 0 });
    }
    return days;
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

  const last7 = getLast7Days();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>학습 통계</Text>

        <View style={[styles.card, styles.streakCard]}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <Text style={styles.streakNum}>{stats?.streak ?? 0}</Text>
          <Text style={styles.streakLabel}>연속 학습일</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>최근 7일 학습량</Text>
          <View style={styles.chartArea}>
            {last7.map((day) => (
              <View key={day.date} style={styles.barCol}>
                <View style={styles.barWrapper}>
                  <View style={[styles.bar, { height: `${(day.count / maxCount) * 100}%`, backgroundColor: day.count > 0 ? C.primary : C.border }]} />
                </View>
                <Text style={styles.barLabel}>{day.label}</Text>
                {day.count > 0 ? <Text style={styles.barCount}>{day.count}</Text> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>종합 현황</Text>
          <View style={styles.summaryGrid}>
            <SummaryItem label="전체 카드" value={stats?.total_cards ?? 0} color={C.primary} styles={styles} />
            <SummaryItem label="완성" value={stats?.mastered_cards ?? 0} color={C.success} styles={styles} />
            <SummaryItem label="학습 중" value={stats?.learning_cards ?? 0} color={C.warning} styles={styles} />
            <SummaryItem label="새 카드" value={stats?.new_cards ?? 0} color={C.danger} styles={styles} />
          </View>
        </View>

        <View style={[styles.card, styles.totalCard]}>
          <View>
            <Text style={styles.totalLabel}>누적 학습 횟수</Text>
            <Text style={styles.totalValue}>{(stats?.total_studied ?? 0).toLocaleString()}회</Text>
          </View>
          <Text style={styles.totalEmoji}>📖</Text>
        </View>

        {(stats?.total_cards ?? 0) > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>학습 진행률</Text>
            <View style={styles.ratioRow}>
              <RatioBar label="완성" count={stats?.mastered_cards ?? 0} total={stats?.total_cards ?? 0} color={C.success} styles={styles} />
              <RatioBar label="학습 중" count={stats?.learning_cards ?? 0} total={stats?.total_cards ?? 0} color={C.warning} styles={styles} />
              <RatioBar label="새 카드" count={stats?.new_cards ?? 0} total={stats?.total_cards ?? 0} color={C.danger} styles={styles} />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, color, styles }: { label: string; value: number; color: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.summaryItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
    </View>
  );
}

function RatioBar({ label, count, total, color, styles }: { label: string; count: number; total: number; color: string; styles: ReturnType<typeof makeStyles> }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <View style={styles.ratioItem}>
      <View style={styles.ratioLabelRow}>
        <Text style={styles.ratioLabel}>{label}</Text>
        <Text style={[styles.ratioPct, { color }]}>{pct}%</Text>
      </View>
      <View style={styles.ratioTrack}>
        <View style={[styles.ratioFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.ratioCount}>{count}장</Text>
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 20 },
    card: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 16 },
    streakCard: { alignItems: 'center', backgroundColor: C.streakBg },
    streakEmoji: { fontSize: 40, marginBottom: 8 },
    streakNum: { fontSize: 48, fontWeight: '800', color: C.streakAccent },
    streakLabel: { fontSize: 14, color: C.streakAccent, fontWeight: '600' },
    chartArea: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 6 },
    barCol: { flex: 1, alignItems: 'center' },
    barWrapper: { flex: 1, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
    bar: { width: '70%', minHeight: 4, borderRadius: 4 },
    barLabel: { fontSize: 11, color: C.textMuted, marginTop: 6 },
    barCount: { fontSize: 10, color: C.primary, fontWeight: '700', marginTop: 2 },
    summaryGrid: { gap: 12 },
    summaryItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    summaryLabel: { flex: 1, fontSize: 14, color: C.textSecondary },
    summaryValue: { fontSize: 18, fontWeight: '700' },
    totalCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.primaryBg },
    totalLabel: { fontSize: 14, color: C.primary, fontWeight: '600', marginBottom: 4 },
    totalValue: { fontSize: 28, fontWeight: '800', color: C.primary },
    totalEmoji: { fontSize: 40 },
    ratioRow: { gap: 14 },
    ratioItem: {},
    ratioLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    ratioLabel: { fontSize: 13, color: C.textSecondary },
    ratioPct: { fontSize: 13, fontWeight: '700' },
    ratioTrack: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
    ratioFill: { height: '100%', borderRadius: 4 },
    ratioCount: { fontSize: 12, color: C.textMuted },
  });
}
