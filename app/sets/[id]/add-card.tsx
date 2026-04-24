import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createCard } from '../../../services/db';
import { useColors } from '../../../hooks/useColors';

export default function AddCardScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const setId = parseInt(id, 10);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async (addAnother = false) => {
    if (!front.trim() || !back.trim()) { Alert.alert('알림', '앞면과 뒷면을 모두 입력해주세요'); return; }
    setSaving(true);
    try {
      await createCard(setId, front.trim(), back.trim());
      if (addAnother) { setFront(''); setBack(''); } else { router.back(); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="뒤로" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>카드 추가</Text>
          <TouchableOpacity onPress={() => handleSave(false)} disabled={saving || !front.trim() || !back.trim()} style={[styles.saveBtn, (!front.trim() || !back.trim() || saving) && styles.saveBtnDisabled]}>
            <Text style={styles.saveBtnText}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <View style={styles.labelBadge}>
                <Text style={styles.labelBadgeText}>앞</Text>
              </View>
              <Text style={styles.label}>앞면 (단어, 질문)</Text>
              <Text style={styles.charCount}>{front.length}/300</Text>
            </View>
            <TextInput style={[styles.input, styles.inputLarge]} value={front} onChangeText={setFront} placeholder="단어, 개념, 질문을 입력하세요" placeholderTextColor={C.textMuted} multiline autoFocus maxLength={300} />
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Ionicons name="swap-vertical" size={20} color={C.textMuted} />
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <View style={[styles.labelBadge, styles.backBadge]}>
                <Text style={styles.labelBadgeText}>뒤</Text>
              </View>
              <Text style={styles.label}>뒷면 (뜻, 답)</Text>
              <Text style={styles.charCount}>{back.length}/500</Text>
            </View>
            <TextInput style={[styles.input, styles.inputLarge]} value={back} onChangeText={setBack} placeholder="뜻, 설명, 답을 입력하세요" placeholderTextColor={C.textMuted} multiline maxLength={500} />
          </View>

          <TouchableOpacity style={styles.addAnotherBtn} onPress={() => handleSave(true)} disabled={saving || !front.trim() || !back.trim()}>
            <Ionicons name="add-circle-outline" size={20} color={C.primary} />
            <Text style={styles.addAnotherText}>저장하고 다음 카드 추가</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    backBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '700', color: C.text },
    saveBtn: { backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
    form: { padding: 20 },
    field: { marginBottom: 8 },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    label: { flex: 1, fontSize: 14, fontWeight: '600', color: C.textSecondary },
    charCount: { fontSize: 12, color: C.textMuted },
    labelBadge: { backgroundColor: C.primary, width: 24, height: 24, borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
    backBadge: { backgroundColor: '#7C3AED' },
    labelBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    input: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, fontSize: 16, color: C.text },
    inputLarge: { minHeight: 100, textAlignVertical: 'top' },
    divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    addAnotherBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: C.primaryBg, borderWidth: 1.5, borderColor: C.primary },
    addAnotherText: { fontSize: 15, fontWeight: '600', color: C.primary },
  });
}
