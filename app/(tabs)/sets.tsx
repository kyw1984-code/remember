import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import BannerAdView from '../../components/BannerAdView';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deleteCardSet } from '../../services/db';
import { useColors } from '../../hooks/useColors';
import SetCard from '../../components/SetCard';
import EmptyState from '../../components/EmptyState';
import { useCardSets } from '../../hooks/useCardSets';

export default function SetsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { sets, loading, refresh } = useCardSets();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const handleDelete = (setId: number, setName: string) => {
    Alert.alert('세트 삭제', `"${setName}"을 삭제할까요?\n모든 카드가 삭제됩니다.`, [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteCardSet(setId); refresh(); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>카드 세트</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/sets/create')} accessibilityLabel="새 세트 만들기" accessibilityRole="button">
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : sets.length === 0 ? (
        <EmptyState
          emoji="📚"
          title="세트가 없습니다"
          description="새 세트를 만들거나 프리셋을 추가해보세요"
          action={
            <View style={{ gap: 10 }}>
              <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push('/sets/create')}>
                <Text style={styles.ctaBtnText}>새 세트 만들기</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnSecondary]} onPress={() => router.push('/sets/presets')}>
                <Text style={[styles.ctaBtnText, styles.ctaBtnSecondaryText]}>프리셋 추가</Text>
              </TouchableOpacity>
            </View>
          }
        />
      ) : (
        <>
        <BannerAdView />
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {sets.map((set) => (
            <SetCard key={set.id} set={set} onPress={() => router.push(`/sets/${set.id}`)} onLongPress={() => handleDelete(set.id, set.name)} />
          ))}
          <TouchableOpacity style={styles.presetBtn} onPress={() => router.push('/sets/presets')}>
            <Ionicons name="sparkles" size={18} color={C.primary} />
            <Text style={styles.presetBtnText}>프리셋 추가</Text>
          </TouchableOpacity>
        </ScrollView>
        </>
      )}
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
    title: { fontSize: 22, fontWeight: '700', color: C.text },
    addBtn: { width: 40, height: 40, backgroundColor: C.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 20, paddingTop: 4 },
    presetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: C.primary, borderStyle: 'dashed', marginTop: 4 },
    presetBtnText: { fontSize: 15, fontWeight: '600', color: C.primary },
    ctaBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center' },
    ctaBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
    ctaBtnSecondary: { backgroundColor: C.primaryBg },
    ctaBtnSecondaryText: { color: C.primary },
  });
}
