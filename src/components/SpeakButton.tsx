/**
 * 朗读按钮：圆形小喇叭，点击调用系统 TTS 朗读，再点停止。
 *
 * 视觉：
 *   - 默认：白底 + 橙色边框 + 橙色喇叭图标
 *   - 朗读中：橙色填充 + 白色停止图标 + 微弱呼吸动画
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONT_HANZI } from '../theme';

interface Props {
  isSpeaking: boolean;
  onPress: () => void;
  size?: number;
  label?: string;
}

export const SpeakButton: React.FC<Props> = ({
  isSpeaking,
  onPress,
  size = 48,
  label,
}) => {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isSpeaking) {
      scale.stopAnimation();
      scale.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isSpeaking, scale]);

  const iconSize = Math.round(size * 0.5);
  const iconColor = isSpeaking ? '#FFFFFF' : COLORS.primary;
  const iconName: keyof typeof Ionicons.glyphMap = isSpeaking
    ? 'stop'
    : 'volume-high';

  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={isSpeaking ? '停止朗读' : '朗读故事'}
      style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.75 }]}
    >
      <Animated.View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ scale }],
          },
          isSpeaking ? styles.circleActive : styles.circleIdle,
        ]}
      >
        <Ionicons name={iconName} size={iconSize} color={iconColor} />
      </Animated.View>
      {label ? (
        <Text style={[styles.label, isSpeaking && { color: COLORS.primaryDeep }]}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: 4,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  circleIdle: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  circleActive: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  label: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONT_HANZI,
    fontWeight: '500',
  },
});
