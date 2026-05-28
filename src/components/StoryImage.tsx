import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { getImageFor } from '../data/imageMap';

interface Props {
  char: string;
  width: number;
  height: number;
}

/**
 * 故事页顶部插图。
 * - 优先使用 imageMap.ts 中静态 require 的本地资源（离线可用）
 * - 缺图时显示一个温和的占位提示
 */
export const StoryImage: React.FC<Props> = ({ char, width, height }) => {
  const source = getImageFor(char);

  if (!source) {
    return (
      <View style={[styles.placeholder, { width, height }]}>
        <Text style={styles.bigChar}>{char}</Text>
        <Text style={styles.placeholderTip}>插图生成中…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { width, height }]}>
      <Image
        source={source}
        style={{ width, height }}
        contentFit="cover"
        transition={200}
        accessibilityLabel={`${char} 字的故事插图`}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#FDE68A',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDE68A',
    borderRadius: 24,
  },
  bigChar: {
    fontSize: 96,
    color: '#92400E',
    fontWeight: '500',
  },
  placeholderTip: {
    marginTop: 12,
    color: '#A16207',
    fontSize: 14,
  },
});
