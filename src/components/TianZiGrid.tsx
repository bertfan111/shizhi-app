import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_HANZI, COLORS } from '../theme';

interface Props {
  char: string;
  size: number;
  fontSize?: number;
  showBackgroundChar?: boolean; // 是否在背景显示半透明的字（描红效果）
}

/**
 * 田字格组件：
 * - 红色实线外框
 * - 中央横竖虚红线（用一组小段 View 模拟虚线，保证 RN/iOS/Web 一致渲染）
 * - 字居中显示
 */
export const TianZiGrid: React.FC<Props> = ({
  char,
  size,
  fontSize,
  showBackgroundChar = false,
}) => {
  const effectiveFontSize = fontSize ?? size * 0.72;
  const dashCount = 12; // 横/竖虚线的虚线段数量

  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius: Math.min(8, size * 0.03),
        },
      ]}
    >
      {/* 横向虚线（位于田字格正中） */}
      <View style={[styles.dashLineRow, { top: size / 2 - 1, width: size }]}>
        {Array.from({ length: dashCount }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.dashSegmentH,
              { width: size / (dashCount * 2), marginHorizontal: size / (dashCount * 4) },
            ]}
          />
        ))}
      </View>

      {/* 竖向虚线 */}
      <View style={[styles.dashLineCol, { left: size / 2 - 1, height: size }]}>
        {Array.from({ length: dashCount }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.dashSegmentV,
              { height: size / (dashCount * 2), marginVertical: size / (dashCount * 4) },
            ]}
          />
        ))}
      </View>

      {/* 背景描红（淡色字，便于练写） */}
      {showBackgroundChar && (
        <Text
          style={[styles.bgChar, { fontSize: effectiveFontSize }]}
          allowFontScaling={false}
        >
          {char}
        </Text>
      )}

      {/* 主字 */}
      <Text
        style={[
          styles.char,
          {
            fontSize: effectiveFontSize,
            lineHeight: effectiveFontSize * 1.05,
          },
        ]}
        allowFontScaling={false}
      >
        {char}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderWidth: 4,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 24,
  },
  dashLineRow: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    height: 2,
  },
  dashLineCol: {
    position: 'absolute',
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
    width: 2,
  },
  dashSegmentH: {
    height: 1.5,
    backgroundColor: COLORS.accent,
    opacity: 0.7,
  },
  dashSegmentV: {
    width: 1.5,
    backgroundColor: COLORS.accent,
    opacity: 0.7,
  },
  char: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
  },
  bgChar: {
    position: 'absolute',
    color: '#FCA5A5',
    opacity: 0.18,
    fontFamily: FONT_HANZI,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
  },
});
