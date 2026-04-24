import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useColors } from '../hooks/useColors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48;
const CARD_HEIGHT = 280;

interface FlashCardProps {
  front: string;
  back: string;
  onFlip?: (isFlipped: boolean) => void;
}

export default function FlashCard({ front, back, onFlip }: FlashCardProps) {
  const C = useColors();
  const [isFlipped, setIsFlipped] = useState(false);
  const rotation = useSharedValue(0);

  const flip = useCallback(() => {
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    rotation.value = withTiming(newFlipped ? 180 : 0, { duration: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFlip?.(newFlipped);
  }, [isFlipped, rotation, onFlip]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [0, 180])}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${interpolate(rotation.value, [0, 180], [180, 360])}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    width: '100%',
    height: '100%',
  }));

  return (
    <TouchableOpacity onPress={flip} activeOpacity={0.9} style={styles.container}>
      <Animated.View style={[styles.card, { backgroundColor: C.surface, borderWidth: 2, borderColor: C.primaryBg }, frontStyle]}>
        <Text style={[styles.label, { color: C.textMuted }]}>앞면</Text>
        <Text style={[styles.mainText, { color: C.text }]}>{front}</Text>
        <Text style={[styles.hint, { color: C.textMuted }]}>탭하여 뒤집기</Text>
      </Animated.View>
      <Animated.View style={[styles.card, { backgroundColor: C.primary }, backStyle]}>
        <Text style={[styles.label, { color: 'rgba(255,255,255,0.6)' }]}>뒷면</Text>
        <Text style={[styles.mainText, { color: '#fff' }]}>{back}</Text>
        <Text style={[styles.hint, { color: 'rgba(255,255,255,0.5)' }]}>탭하여 앞면 보기</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { width: CARD_WIDTH, height: CARD_HEIGHT, alignSelf: 'center' },
  card: {
    borderRadius: 20,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    position: 'absolute',
    top: 16,
    left: 20,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mainText: { fontSize: 26, fontWeight: '700', textAlign: 'center', lineHeight: 36 },
  hint: { position: 'absolute', bottom: 16, fontSize: 12 },
});
