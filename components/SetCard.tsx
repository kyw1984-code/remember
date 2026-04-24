import React, { useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { CardSet } from '../services/db';
import { useColors } from '../hooks/useColors';

interface SetCardProps {
  set: CardSet;
  onPress: () => void;
  onLongPress?: () => void;
  onDelete?: () => void;
  dueCount?: number;
}

const CATEGORY_COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function SetCard({ set, onPress, onLongPress, onDelete, dueCount }: SetCardProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);
  const swipeRef = useRef<Swipeable>(null);

  const color = CATEGORY_COLORS[set.id % CATEGORY_COLORS.length];
  const initials = set.name.slice(0, 2);

  const deleteHandler = onDelete ?? onLongPress;

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.deleteAction}
      onPress={() => { swipeRef.current?.close(); deleteHandler?.(); }}
      activeOpacity={0.8}
    >
      <Ionicons name="trash" size={22} color="#fff" />
      <Text style={styles.deleteActionText}>삭제</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={deleteHandler ? renderRightActions : undefined}
      overshootRight={false}
      friction={2}
    >
      <TouchableOpacity style={styles.container} onPress={onPress} onLongPress={onLongPress} activeOpacity={0.8}>
        <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
          <Text style={[styles.initials, { color }]}>{initials}</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>{set.name}</Text>
          <Text style={styles.meta}>{set.card_count}장</Text>
          {set.description ? <Text style={styles.desc} numberOfLines={1}>{set.description}</Text> : null}
        </View>
        {(dueCount !== undefined && dueCount > 0) ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{dueCount > 99 ? '99+' : dueCount}</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
      </TouchableOpacity>
    </Swipeable>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    iconBg: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    initials: { fontSize: 16, fontWeight: '700' },
    content: { flex: 1 },
    name: { fontSize: 16, fontWeight: '600', color: C.text, marginBottom: 2 },
    meta: { fontSize: 13, color: C.textSecondary },
    desc: { fontSize: 12, color: C.textMuted, marginTop: 2 },
    badge: {
      backgroundColor: C.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginRight: 8,
    },
    badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
    deleteAction: {
      backgroundColor: '#DC2626',
      justifyContent: 'center',
      alignItems: 'center',
      width: 80,
      marginBottom: 10,
      borderRadius: 16,
    },
    deleteActionText: { color: '#fff', fontSize: 12, fontWeight: '700', marginTop: 4 },
  });
}
