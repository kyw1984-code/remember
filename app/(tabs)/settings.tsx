import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../stores/settingsStore';
import { exportData, importData } from '../../services/backup';
import { requestNotificationPermission, scheduleDailyReminder, cancelAllNotifications } from '../../services/notifications';
import { useColors } from '../../hooks/useColors';

const GOAL_OPTIONS = [10, 20, 30, 50];
const TIME_OPTIONS = ['07:00', '08:00', '09:00', '10:00', '18:00', '20:00', '21:00', '22:00'];

export default function SettingsScreen() {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const { dailyGoal, notificationsEnabled, notificationTime, setDailyGoal, setNotificationsEnabled, setNotificationTime } = useSettingsStore();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleToggleNotification = async (value: boolean) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) { Alert.alert('알림 권한', '설정에서 알림 권한을 허용해주세요.'); return; }
      setNotificationsEnabled(true);
      await scheduleDailyReminder(notificationTime);
    } else {
      setNotificationsEnabled(false);
      await cancelAllNotifications();
    }
  };

  const handleTimeSelect = async (time: string) => {
    setNotificationTime(time);
    if (notificationsEnabled) await scheduleDailyReminder(time);
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportData(); } catch { Alert.alert('오류', '내보내기에 실패했습니다.'); } finally { setExporting(false); }
  };

  const handleImport = async () => {
    setImporting(true);
    try { const result = await importData(); Alert.alert(result.success ? '완료' : '오류', result.message); } finally { setImporting(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>설정</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>일일 학습 목표</Text>
          <View style={styles.optionRow}>
            {GOAL_OPTIONS.map((g) => (
              <TouchableOpacity key={g} style={[styles.optionBtn, dailyGoal === g && styles.optionBtnActive]} onPress={() => setDailyGoal(g)}>
                <Text style={[styles.optionText, dailyGoal === g && styles.optionTextActive]}>{g}장</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.sectionTitle}>복습 알림</Text>
              <Text style={styles.sectionDesc}>매일 지정한 시간에 알림을 받습니다</Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={handleToggleNotification} trackColor={{ false: C.border, true: C.primary }} thumbColor="#fff" />
          </View>
          {notificationsEnabled && (
            <View style={styles.timeGrid}>
              {TIME_OPTIONS.map((t) => (
                <TouchableOpacity key={t} style={[styles.timeBtn, notificationTime === t && styles.timeBtnActive]} onPress={() => handleTimeSelect(t)}>
                  <Text style={[styles.timeText, notificationTime === t && styles.timeTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>백업 / 복원</Text>
          <View style={styles.actionList}>
            <TouchableOpacity style={[styles.actionBtn, exporting && styles.actionBtnDisabled]} onPress={handleExport} disabled={exporting}>
              <Ionicons name="share-outline" size={20} color={C.primary} />
              <Text style={styles.actionBtnText}>{exporting ? '내보내는 중...' : '데이터 내보내기'}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLast, importing && styles.actionBtnDisabled]} onPress={handleImport} disabled={importing}>
              <Ionicons name="download-outline" size={20} color={C.success} />
              <Text style={styles.actionBtnText}>{importing ? '가져오는 중...' : '데이터 가져오기'}</Text>
              <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>앱 정보</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>버전</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>플랫폼</Text>
            <Text style={styles.infoValue}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>법적 정보</Text>
          <View style={styles.actionList}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://kyw1984-code.github.io/remember/privacy.html')}>
              <Ionicons name="shield-checkmark-outline" size={20} color={C.primary} />
              <Text style={styles.actionBtnText}>개인정보처리방침</Text>
              <Ionicons name="open-outline" size={16} color={C.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.actionBtnLast]} onPress={() => Linking.openURL('https://kyw1984-code.github.io/remember/terms.html')}>
              <Ionicons name="document-text-outline" size={20} color={C.textSecondary} />
              <Text style={styles.actionBtnText}>이용약관</Text>
              <Ionicons name="open-outline" size={16} color={C.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    scroll: { padding: 20, paddingBottom: 40 },
    title: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 24 },
    section: { backgroundColor: C.surface, borderRadius: 20, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 4 },
    sectionDesc: { fontSize: 13, color: C.textMuted, marginBottom: 14 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    optionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    optionBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
    optionBtnActive: { borderColor: C.primary, backgroundColor: C.primaryBg },
    optionText: { fontSize: 14, fontWeight: '600', color: C.textSecondary },
    optionTextActive: { color: C.primary },
    timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
    timeBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background },
    timeBtnActive: { borderColor: C.primary, backgroundColor: C.primaryBg },
    timeText: { fontSize: 13, fontWeight: '600', color: C.textSecondary },
    timeTextActive: { color: C.primary },
    actionList: { borderWidth: 1, borderColor: C.border, borderRadius: 14, marginTop: 12, overflow: 'hidden' },
    actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.border },
    actionBtnLast: { borderBottomWidth: 0 },
    actionBtnDisabled: { opacity: 0.5 },
    actionBtnText: { flex: 1, fontSize: 15, color: C.text, fontWeight: '500' },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border },
    infoLabel: { fontSize: 14, color: C.textSecondary },
    infoValue: { fontSize: 14, color: C.text, fontWeight: '600' },
  });
}
