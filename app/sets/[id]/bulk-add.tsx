import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { bulkCreateCards } from '../../../services/db';
import { useColors } from '../../../hooks/useColors';

interface ParsedCard {
  front: string;
  back: string;
}

function parseCards(text: string): ParsedCard[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const sepIdx = line.indexOf(':');
      const tabIdx = line.indexOf('\t');
      const idx = tabIdx !== -1 && (sepIdx === -1 || tabIdx < sepIdx) ? tabIdx : sepIdx;
      if (idx === -1) return null;
      const front = line.slice(0, idx).trim();
      const back = line.slice(idx + 1).trim();
      if (!front || !back) return null;
      return { front, back };
    })
    .filter((c): c is ParsedCard => c !== null);
}

export default function BulkAddScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const setId = parseInt(id, 10);

  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const parsed = useMemo(() => parseCards(text), [text]);

  const handleSave = async () => {
    if (parsed.length === 0) { Alert.alert('알림', '추가할 카드가 없습니다.'); return; }
    setSaving(true);
    try {
      await bulkCreateCards(setId, parsed);
      Alert.alert('완료', `${parsed.length}개 카드가 추가되었습니다.`, [{ text: '확인', onPress: () => router.back() }]);
    } catch {
      Alert.alert('오류', '카드 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>카드 일괄 추가</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.hint}>
            <Ionicons name="information-circle" size={16} color={C.primary} />
            <Text style={styles.hintText}>한 줄에 카드 하나씩 입력하세요{'\n'}형식: <Text style={styles.hintCode}>앞면:뒷면</Text> (탭 구분도 지원)</Text>
          </View>

          <TextInput
            style={styles.textarea}
            value={text}
            onChangeText={setText}
            multiline
            placeholder={'사과:apple\n고양이:cat\n학교:school'}
            placeholderTextColor={C.textMuted}
            autoCorrect={false}
            autoCapitalize="none"
            textAlignVertical="top"
          />

          {parsed.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={styles.previewTitle}>미리보기 ({parsed.length}개)</Text>
              {parsed.slice(0, 10).map((card, i) => (
                <View key={i} style={styles.previewItem}>
                  <Text style={styles.previewFront} numberOfLines={1}>{card.front}</Text>
                  <Ionicons name="arrow-forward" size={14} color={C.textMuted} />
                  <Text style={styles.previewBack} numberOfLines={1}>{card.back}</Text>
                </View>
              ))}
              {parsed.length > 10 && (
                <Text style={styles.previewMore}>...외 {parsed.length - 10}개</Text>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, (parsed.length === 0 || saving) && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={parsed.length === 0 || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{parsed.length > 0 ? `${parsed.length}개 카드 추가` : '카드 추가'}</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    backBtn: { padding: 4 },
    title: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: C.text },
    content: { padding: 16, gap: 16 },
    hint: { flexDirection: 'row', gap: 8, backgroundColor: C.primaryBg, borderRadius: 12, padding: 12, alignItems: 'flex-start' },
    hintText: { flex: 1, fontSize: 13, color: C.primary, lineHeight: 20 },
    hintCode: { fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    textarea: {
      backgroundColor: C.surface,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: C.border,
      padding: 14,
      fontSize: 15,
      color: C.text,
      minHeight: 200,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    previewSection: { backgroundColor: C.surface, borderRadius: 14, padding: 14, gap: 8 },
    previewTitle: { fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4 },
    previewItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    previewFront: { flex: 1, fontSize: 14, fontWeight: '600', color: C.text },
    previewBack: { flex: 1, fontSize: 14, color: C.textSecondary },
    previewMore: { fontSize: 13, color: C.textMuted, textAlign: 'center', paddingTop: 4 },
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
