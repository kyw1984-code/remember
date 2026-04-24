import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCards, getCardSet, deleteCard, getDueCardsForSet, Card, CardSet } from '../../services/db';
import { useColors } from '../../hooks/useColors';
import EmptyState from '../../components/EmptyState';

export default function SetDetailScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const setId = parseInt(id, 10);

  const [cardSet, setCardSet] = useState<CardSet | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cs, c, dc] = await Promise.all([getCardSet(setId), getCards(setId), getDueCardsForSet(setId)]);
      setCardSet(cs);
      setCards(c);
      setDueCount(dc.length);
    } catch {
      Alert.alert('오류', '데이터를 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [setId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q));
  }, [cards, query]);

  const handleDeleteCard = (cardId: number, front: string) => {
    Alert.alert('카드 삭제', `"${front}"를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => {
        try { await deleteCard(cardId); load(); } catch { Alert.alert('오류', '카드 삭제에 실패했습니다.'); }
      }},
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="뒤로" accessibilityRole="button">
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{cardSet?.name ?? ''}</Text>
          <Text style={styles.sub}>{cards.length}장</Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/sets/edit/${setId}`)} style={styles.iconBtn} accessibilityLabel="세트 편집" accessibilityRole="button">
          <Ionicons name="pencil" size={20} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.studyBtn]} onPress={() => router.push(`/study/${setId}?mode=all`)} disabled={cards.length === 0}>
          <Ionicons name="play" size={18} color="#fff" />
          <Text style={styles.actionBtnText}>전체 학습</Text>
        </TouchableOpacity>
        {dueCount > 0 && (
          <TouchableOpacity style={[styles.actionBtn, styles.reviewBtn]} onPress={() => router.push(`/study/${setId}?mode=due`)}>
            <Ionicons name="refresh" size={18} color={C.primary} />
            <Text style={[styles.actionBtnText, { color: C.primary }]}>복습 ({dueCount})</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.addCardBtn} onPress={() => router.push(`/sets/${setId}/add-card`)} accessibilityLabel="카드 추가" accessibilityRole="button">
          <Ionicons name="add" size={20} color={C.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.bulkBtn} onPress={() => router.push(`/sets/${setId}/bulk-add`)} accessibilityLabel="카드 일괄 추가" accessibilityRole="button">
          <Ionicons name="list" size={18} color={C.textSecondary} />
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <EmptyState
          emoji="🃏"
          title="카드가 없습니다"
          description="카드를 추가해서 학습을 시작하세요"
          action={
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push(`/sets/${setId}/add-card`)}>
              <Text style={styles.ctaBtnText}>카드 추가</Text>
            </TouchableOpacity>
          }
        />
      ) : (
        <>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={C.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="카드 검색..."
              placeholderTextColor={C.textMuted}
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <Text style={styles.searchCount}>
                {filtered.length}/{cards.length}
              </Text>
            )}
          </View>

          {filtered.length === 0 ? (
            <View style={styles.noResult}>
              <Text style={styles.noResultText}>"{query}"에 해당하는 카드가 없습니다</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
              {filtered.map((card) => (
                <TouchableOpacity
                  key={card.id}
                  style={styles.cardItem}
                  onLongPress={() => handleDeleteCard(card.id, card.front)}
                  onPress={() => router.push(`/sets/${setId}/edit-card/${card.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardFront} numberOfLines={2}>{card.front}</Text>
                    <Text style={styles.cardBack} numberOfLines={2}>{card.back}</Text>
                  </View>
                  <Ionicons name="pencil-outline" size={16} color={C.textMuted} />
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface, gap: 8 },
    backBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '700', color: C.text },
    sub: { fontSize: 12, color: C.textMuted, marginTop: 1 },
    iconBtn: { padding: 8 },
    actions: { flexDirection: 'row', gap: 8, padding: 16, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
    studyBtn: { backgroundColor: C.primary },
    reviewBtn: { backgroundColor: C.primaryBg, borderWidth: 1.5, borderColor: C.primary },
    actionBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
    addCardBtn: { width: 44, height: 44, backgroundColor: C.primaryBg, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.primary },
    bulkBtn: { width: 44, height: 44, backgroundColor: C.surface, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: C.border },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: C.surface,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: C.border,
    },
    searchInput: { flex: 1, fontSize: 15, color: C.text },
    searchCount: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
    noResult: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    noResultText: { fontSize: 14, color: C.textMuted, textAlign: 'center' },
    list: { padding: 16, paddingTop: 8 },
    cardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1, gap: 10 },
    cardFront: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 4 },
    cardBack: { fontSize: 13, color: C.textSecondary },
    ctaBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32 },
    ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  });
}
