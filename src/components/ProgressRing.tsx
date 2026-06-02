import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_HANZI, FONT_PINYIN } from '../theme';

interface Props {
  current: number;
  total: number;
  size?: number;
}

/**
 * 简易进度环：用旋转的半圆遮罩模拟圆形进度，无需引入 react-native-svg。
 */
export const ProgressRing: React.FC<Props> = ({ current, total, size = 132 }) => {
  const safeTotal = Math.max(total, 1);
  const ratio = Math.max(0, Math.min(1, current / safeTotal));
  const percent = Math.round(ratio * 100);
  const stroke = Math.round(size * 0.1);
  const inner = size - stroke * 2;

  return (
    <View style={[styles.outerRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[
          styles.progressLayer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: stroke,
            borderColor: ratio > 0 ? COLORS.primary : '#E5E7EB',
            opacity: ratio > 0 ? 1 : 0.6,
          },
        ]}
      />
      <View
        style={[
          styles.innerCircle,
          {
            width: inner,
            height: inner,
            borderRadius: inner / 2,
          },
        ]}
      >
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.label}>已掌握</Text>
        <Text style={styles.fraction}>
          {current} / {total}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.borderSoft,
  },
  progressLayer: {
    position: 'absolute',
  },
  innerCircle: {
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDeep,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  percent: {
    color: COLORS.primaryDeep,
    fontFamily: FONT_PINYIN,
    fontSize: 28,
    fontWeight: '800',
  },
  label: {
    color: COLORS.textMuted,
    fontFamily: FONT_HANZI,
    fontSize: 12,
    marginTop: 2,
  },
  fraction: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
});
