import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createCardSet, bulkCreateCards } from '../../services/db';
import { PRESETS, PresetMeta } from '../../constants/presets';
import { useColors } from '../../hooks/useColors';

const PRESET_FILES: Record<string, () => Promise<Array<{ front: string; back: string }>>> = {
  suneung_english: () => import('../../constants/presets/suneung_english.json').then((m) => m.default as Array<{ front: string; back: string }>),
  toeic_words: () => import('../../constants/presets/toeic_words.json').then((m) => m.default as Array<{ front: string; back: string }>),
  korean_history: () => import('../../constants/presets/korean_history.json').then((m) => m.default as Array<{ front: string; back: string }>),
  korean_history_exam: () => import('../../constants/presets/korean_history_exam.json').then((m) => m.default as Array<{ front: string; back: string }>),
  info_processing: () => import('../../constants/presets/info_processing.json').then((m) => m.default as Array<{ front: string; back: string }>),
  hanja: () => import('../../constants/presets/hanja.json').then((m) => m.default as Array<{ front: string; back: string }>),
  idioms: () => import('../../constants/presets/idioms.json').then((m) => m.default as Array<{ front: string; back: string }>),
};

const CATEGORY_COLORS: Record<string, string> = {
  '영어': '#4F46E5',
  '한국사': '#059669',
  'IT': '#0891B2',
  '한자': '#D97706',
  '국어': '#7C3AED',
};

export default function PresetsScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [loading, setLoading] = useState<string | null>(null);

  const handleAdd = async (preset: PresetMeta) => {
    Alert.alert(
      `${preset.emoji} ${preset.name}`,
      `${preset.cardCount}장짜리 프리셋을 추가할까요?\n학습 카드 세트로 생성됩니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '추가', onPress: async () => {
            setLoading(preset.id);
            try {
              const loader = PRESET_FILES[preset.id];
              if (!loader) return;
              const cards = await loader();
              const setId = await createCardSet(preset.name, preset.description, preset.id);
              await bulkCreateCards(setId, cards);
              router.replace(`/sets/${setId}`);
            } catch {
              Alert.alert('오류', '프리셋 추가에 실패했습니다');
            } finally {
              setLoading(null);
            }
          },
        },
      ]
    );
  };

  const categories = [...new Set(PRESETS.map((p) => p.category))];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>프리셋 카드 세트</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.desc}>미리 만들어진 카드 세트를 추가하세요. 완전 무료·오프라인 지원!</Text>
        {categories.map((cat) => (
          <View key={cat} style={styles.section}>
            <View style={[styles.catBadge, { backgroundColor: (CATEGORY_COLORS[cat] ?? C.primary) + '15' }]}>
              <Text style={[styles.catLabel, { color: CATEGORY_COLORS[cat] ?? C.primary }]}>{cat}</Text>
            </View>
            {PRESETS.filter((p) => p.category === cat).map((preset) => (
              <TouchableOpacity key={preset.id} style={styles.presetItem} onPress={() => handleAdd(preset)} disabled={loading === preset.id} activeOpacity={0.8}>
                <Text style={styles.presetEmoji}>{preset.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.presetName}>{preset.name}</Text>
                  <Text style={styles.presetDesc}>{preset.description}</Text>
                  <Text style={styles.presetCount}>{preset.cardCount}장</Text>
                </View>
                {loading === preset.id ? (
                  <ActivityIndicator size="small" color={C.primary} />
                ) : (
                  <View style={styles.addBtn}>
                    <Ionicons name="add" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    backBtn: { padding: 4 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: C.text },
    scroll: { padding: 20 },
    desc: { fontSize: 14, color: C.textSecondary, marginBottom: 24, lineHeight: 20 },
    section: { marginBottom: 24 },
    catBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 12 },
    catLabel: { fontSize: 13, fontWeight: '700' },
    presetItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 10, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
    presetEmoji: { fontSize: 28 },
    presetName: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 2 },
    presetDesc: { fontSize: 12, color: C.textSecondary, marginBottom: 4 },
    presetCount: { fontSize: 12, color: C.primary, fontWeight: '600' },
    addBtn: { width: 34, height: 34, backgroundColor: C.primary, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  });
}
