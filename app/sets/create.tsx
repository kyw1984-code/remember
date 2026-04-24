import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { createCardSet } from '../../services/db';
import { useColors } from '../../hooks/useColors';

export default function CreateSetScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('알림', '세트 이름을 입력해주세요'); return; }
    setSaving(true);
    try {
      const id = await createCardSet(name.trim(), description.trim());
      router.replace(`/sets/${id}`);
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
          <Text style={styles.title}>새 세트 만들기</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || !name.trim()} style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]}>
            <Text style={styles.saveBtnText}>저장</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>세트 이름 *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="예: 수능 영단어, 공무원 한국사" placeholderTextColor={C.textMuted} autoFocus maxLength={50} />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={description} onChangeText={setDescription} placeholder="세트에 대한 설명을 입력하세요" placeholderTextColor={C.textMuted} multiline numberOfLines={3} maxLength={200} />
          </View>
          <View style={styles.tip}>
            <Ionicons name="information-circle" size={18} color={C.primary} />
            <Text style={styles.tipText}>세트 저장 후 카드를 추가할 수 있습니다</Text>
          </View>
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
    field: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: C.textSecondary, marginBottom: 8 },
    input: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, fontSize: 16, color: C.text },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
    tip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primaryBg, borderRadius: 12, padding: 12 },
    tipText: { fontSize: 13, color: C.primary, flex: 1 },
  });
}
