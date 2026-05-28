import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions, Animated } from 'react-native';
import type { Character } from '../types';
import { TianZiGrid } from './TianZiGrid';
import { BouncyPressable } from './BouncyPressable';
import { FONT_PINYIN, FONT_HANZI, COLORS } from '../theme';

interface Props {
  data: Character;
  index: number;
  total: number;
  onPress: (char: string) => void;
}

export const CharacterCard: React.FC<Props> = ({ data, index, total, onPress }) => {
  const { width, height } = useWindowDimensions();
  const boxSize = Math.min(width * 0.72, height * 0.45);
  const pinyinSize = Math.max(32, boxSize * 0.15);

  const entranceAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(entranceAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [data.char]);

  return (
    <View style={[styles.container, { width }]}>
      <View style={styles.topSpacer} />

      <Animated.View
        style={[
          styles.mainContent,
          { transform: [{ scale: entranceAnim }], opacity: opacityAnim },
        ]}
      >
        <Text style={[styles.pinyin, { fontSize: pinyinSize }]} numberOfLines={1}>
          {data.pinyin}
        </Text>

        <BouncyPressable
          onPress={() => onPress(data.char)}
          scaleTo={0.9}
          style={styles.gridWrap}
          accessibilityRole="button"
          accessibilityLabel={`生字 ${data.char}，点击查看故事`}
        >
          <View style={styles.gridShadow}>
            <TianZiGrid char={data.char} size={boxSize} />
          </View>
        </BouncyPressable>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.hintPill}>
          <Text style={styles.hint}>👆 点击卡片，看有趣的故事</Text>
        </View>
        <View style={styles.progressPill}>
          <Text style={styles.progress}>
            {index + 1} / {total}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 24,
    backgroundColor: COLORS.bg,
  },
  topSpacer: {
    height: 8,
  },
  mainContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 20,
    textShadowColor: 'rgba(245, 158, 11, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gridWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridShadow: {
    borderRadius: 24,
    backgroundColor: COLORS.card,
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  footer: {
    alignItems: 'center',
    gap: 10,
  },
  hintPill: {
    backgroundColor: COLORS.borderSoft,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  hint: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '600',
  },
  progressPill: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 999,
  },
  progress: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontFamily: FONT_HANZI,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
});
