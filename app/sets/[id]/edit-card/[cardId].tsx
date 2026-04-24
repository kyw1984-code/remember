import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCard, updateCard, deleteCard } from '../../../../services/db';
import { useColors } from '../../../../hooks/useColors';

export default function EditCardScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const card = await getCard(parseInt(cardId, 10));
      if (card) { setFront(card.front); setBack(card.back); }
      setLoading(false);
    };
    load();
  }, [cardId]);

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) { Alert.alert('알림', '앞면과 뒷면을 모두 입력해주세요'); return; }
    setSaving(true);
    try { await updateCard(parseInt(cardId, 10), front.trim(), back.trim()); router.back(); } finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('카드 삭제', '이 카드를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteCard(parseInt(cardId, 10)); router.back(); } },
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="뒤로" accessibilityRole="button">
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </TouchableOpacity>
          <Text style={styles.title}>카드 편집</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} accessibilityLabel="카드 삭제" accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={C.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>앞면</Text>
              <Text style={styles.charCount}>{front.length}/300</Text>
            </View>
            <TextInput style={[styles.input, styles.inputLarge]} value={front} onChangeText={setFront} placeholder="단어, 개념, 질문을 입력하세요" placeholderTextColor={C.textMuted} multiline maxLength={300} />
          </View>

          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>뒷면</Text>
              <Text style={styles.charCount}>{back.length}/500</Text>
            </View>
            <TextInput style={[styles.input, styles.inputLarge]} value={back} onChangeText={setBack} placeholder="뜻, 설명, 답을 입력하세요" placeholderTextColor={C.textMuted} multiline maxLength={500} />
          </View>

          <TouchableOpacity style={[styles.saveBtn, (!front.trim() || !back.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || !front.trim() || !back.trim()}>
            <Text style={styles.saveBtnText}>저장</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface },
    backBtn: { padding: 4 },
    title: { fontSize: 17, fontWeight: '700', color: C.text },
    deleteBtn: { padding: 8 },
    form: { padding: 20 },
    field: { marginBottom: 16 },
    labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    charCount: { fontSize: 12, color: C.textMuted },
    input: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, fontSize: 16, color: C.text },
    inputLarge: { minHeight: 100, textAlignVertical: 'top' },
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  });
}
