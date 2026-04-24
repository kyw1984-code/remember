import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getCardSet, updateCardSet, deleteCardSet } from '../../../services/db';
import { useColors } from '../../../hooks/useColors';

export default function EditSetScreen() {
  const router = useRouter();
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { setId } = useLocalSearchParams<{ setId: string }>();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const cs = await getCardSet(parseInt(setId, 10));
      if (cs) { setName(cs.name); setDescription(cs.description); }
      setLoading(false);
    };
    load();
  }, [setId]);

  const handleDelete = () => {
    Alert.alert('세트 삭제', '이 세트와 포함된 모든 카드가 삭제됩니다. 계속할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: async () => { await deleteCardSet(parseInt(setId, 10)); router.replace('/(tabs)/sets'); } },
    ]);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('알림', '세트 이름을 입력해주세요'); return; }
    setSaving(true);
    try { await updateCardSet(parseInt(setId, 10), name.trim(), description.trim()); router.back(); } finally { setSaving(false); }
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
          <Text style={styles.title}>세트 편집</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} accessibilityLabel="세트 삭제" accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={C.danger} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>세트 이름 *</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} maxLength={50} autoFocus />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>설명 (선택)</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={description} onChangeText={setDescription} multiline numberOfLines={3} maxLength={200} />
          </View>
          <TouchableOpacity style={[styles.saveBtn, (!name.trim() || saving) && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving || !name.trim()}>
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
    saveBtn: { backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
    saveBtnDisabled: { opacity: 0.4 },
    saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    form: { padding: 20 },
    field: { marginBottom: 20 },
    label: { fontSize: 14, fontWeight: '600', color: C.textSecondary, marginBottom: 8 },
    input: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, padding: 14, fontSize: 16, color: C.text },
    inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  });
}
