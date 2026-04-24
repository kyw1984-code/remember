import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getWrongCards } from '../../services/db';
import { useColors } from '../../hooks/useColors';
import EmptyState from '../../components/EmptyState';

interface WrongCard {
  id: number;
  set_id: number;
  set_name: string;
  front: string;
  back: string;
  created_at: string;
  wrong_count: number;
}

interface WrongGroup {
  set_id: number;
  set_name: string;
  cards: WrongCard[];
}

export default function WrongNotesScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [groups, setGroups] = useState<WrongGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getWrongCards() as WrongCard[];
        const map = new Map<number, WrongGroup>();
        for (const card of data) {
          if (!map.has(card.set_id)) map.set(card.set_id, { set_id: card.set_id, set_name: card.set_name, cards: [] });
          map.get(card.set_id)!.cards.push(card);
        }
        setGroups(Array.from(map.values()));
      } catch {
        Alert.alert('오류', '오답 카드를 불러오는 데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []));

  const totalCount = groups.reduce((sum, g) => sum + g.cards.length, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="뒤로" accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>오답 노트</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : groups.length === 0 ? (
        <EmptyState emoji="🎯" title="오답 카드가 없습니다" description="학습을 시작하면 틀린 카드가 여기에 기록됩니다" />
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.count}>총 {totalCount}개의 오답 카드</Text>
          {groups.map((group) => (
            <View key={group.set_id} style={styles.groupContainer}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.set_name}</Text>
                  <Text style={styles.groupCount}>{group.cards.length}개 오답</Text>
                </View>
                <TouchableOpacity style={styles.studyBtn} onPress={() => router.push(`/study/${group.set_id}?mode=wrong`)}>
                  <Ionicons name="play" size={14} color="#fff" />
                  <Text style={styles.studyBtnText}>오답만 복습</Text>
                </TouchableOpacity>
              </View>
              {group.cards.map((card) => (
                <View key={card.id} style={styles.cardItem}>
                  <View style={styles.wrongBadge}>
                    <Text style={styles.wrongBadgeText}>✗ {card.wrong_count}번</Text>
                  </View>
                  <Text style={styles.cardFront}>{card.front}</Text>
                  <View style={styles.separator} />
                  <Text style={styles.cardBack}>{card.back}</Text>
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    backBtn: { padding: 4 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: C.text },
    list: { padding: 16 },
    count: { fontSize: 14, color: C.textSecondary, marginBottom: 16 },
    groupContainer: { marginBottom: 20, backgroundColor: C.surface, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    groupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.primaryBg },
    groupInfo: { flex: 1 },
    groupName: { fontSize: 15, fontWeight: '700', color: C.primary },
    groupCount: { fontSize: 12, color: C.textSecondary, marginTop: 2 },
    studyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
    studyBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
    cardItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: C.border },
    wrongBadge: { alignSelf: 'flex-start', backgroundColor: C.dangerBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginBottom: 8 },
    wrongBadgeText: { fontSize: 11, color: C.danger, fontWeight: '700' },
    cardFront: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 6 },
    separator: { height: 1, backgroundColor: C.border, marginBottom: 6 },
    cardBack: { fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  });
}
