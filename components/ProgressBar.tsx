import React from 'react';
import { View, LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useColors } from '../hooks/useColors';

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: number;
}

export default function ProgressBar({ progress, color, height = 6 }: ProgressBarProps) {
  const C = useColors();
  const fillColor = color ?? C.primary;
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const containerWidth = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width;
  };

  const animStyle = useAnimatedStyle(() => ({
    width: withTiming(containerWidth.value * clampedProgress, { duration: 400 }),
  }));

  return (
    <View
      onLayout={onLayout}
      style={{ backgroundColor: C.border, borderRadius: 999, overflow: 'hidden', width: '100%', height }}
    >
      <Animated.View style={[{ backgroundColor: fillColor, height, borderRadius: 999 }, animStyle]} />
    </View>
  );
}
