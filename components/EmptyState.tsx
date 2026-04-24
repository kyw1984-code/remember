import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../hooks/useColors';

interface EmptyStateProps {
  emoji: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  const C = useColors();
  const styles = useMemo(() => makeStyles(C), [C]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{description}</Text>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

function makeStyles(C: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emoji: { fontSize: 56, marginBottom: 16 },
    title: { fontSize: 20, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 8 },
    desc: { fontSize: 15, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
    action: { marginTop: 24 },
  });
}
