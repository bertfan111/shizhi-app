import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { PinyinChar } from '../types';
import { FONT_HANZI, FONT_PINYIN, COLORS } from '../theme';

interface Props {
  annotated: PinyinChar[];
  charSize?: number;
  pinyinSize?: number;
  targetChar?: string; // 高亮主目标字
}

/**
 * 把"逐字拼音"渲染为：
 *   ┌──────────┐ ┌──────────┐ ...
 *   │  tiān    │ │  kōng    │
 *   │   天     │ │   空     │
 *   └──────────┘ └──────────┘
 *
 * 自动换行：用 flexWrap，按字符为单位排版。标点 pinyin 为 null 时只渲染字符本身。
 */
export const PinyinText: React.FC<Props> = ({
  annotated,
  charSize = 30,
  pinyinSize = 14,
  targetChar,
}) => {
  return (
    <View style={styles.row}>
      {annotated.map((item, idx) => {
        const isPunct = item.pinyin == null;
        const isTarget = Boolean(targetChar && item.char === targetChar);
        return (
          <View key={`${item.char}-${idx}`} style={styles.cell}>
            <Text
              style={[
                styles.pinyin,
                { fontSize: pinyinSize, minHeight: pinyinSize + 4 },
                isPunct && styles.hidden,
                isTarget && styles.pinyinHighlight,
              ]}
              numberOfLines={1}
              allowFontScaling={false}
            >
              {item.pinyin ?? ' '}
            </Text>
            <Text
              style={[
                styles.char,
                { fontSize: charSize, lineHeight: charSize * 1.2 },
                isTarget && styles.charHighlight,
              ]}
              allowFontScaling={false}
            >
              {item.char}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  cell: {
    alignItems: 'center',
    paddingHorizontal: 4,
    marginVertical: 4,
  },
  pinyin: {
    color: COLORS.primary,
    fontFamily: FONT_PINYIN,
    fontWeight: '500',
    textAlign: 'center',
  },
  pinyinHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  char: {
    color: COLORS.text,
    fontFamily: FONT_HANZI,
    textAlign: 'center',
    includeFontPadding: false,
  },
  charHighlight: {
    color: COLORS.accent,
    fontWeight: '700',
  },
  hidden: {
    opacity: 0,
  },
});
